"use client";

import { useState, useRef } from "react";

interface CsvRow {
  filename: string;
  year: string;
  description: string;
  matched: boolean;
}

interface ImportResult {
  imported: number;
  importedWithoutImage: number;
  skipped: number;
  errors: { filename: string; error: string }[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string, imageNames: Set<string>): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const filenameIdx = header.indexOf("filename");
  const yearIdx = header.indexOf("year");
  const descriptionIdx = header.indexOf("description");

  if (filenameIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const filename = cols[filenameIdx] ?? "";
    return {
      filename,
      year: yearIdx !== -1 ? (cols[yearIdx] ?? "") : "",
      description: descriptionIdx !== -1 ? (cols[descriptionIdx] ?? "") : "",
      matched: imageNames.has(filename.toLowerCase()),
    };
  });
}

export default function PhotoImporter({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const rebuildRows = (text: string, images: File[]) => {
    const imageNames = new Set(images.map((f) => f.name.toLowerCase()));
    setCsvRows(parseCSV(text, imageNames));
  };

  const handleCsvChange = (file: File) => {
    setCsvFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => rebuildRows(e.target?.result as string, imageFiles);
    reader.readAsText(file, "utf-8");
  };

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
    setResult(null);
    setError(null);
    if (csvFile) {
      const reader = new FileReader();
      reader.onload = (e) => rebuildRows(e.target?.result as string, files);
      reader.readAsText(csvFile, "utf-8");
    }
  };

  const matchedCount = csvRows.filter((r) => r.matched).length;
  const unmatchedCount = csvRows.filter((r) => !r.matched && r.filename).length;

  const handleImport = async () => {
    if (!csvFile) return;

    setImporting(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      const BATCH = 10;
      let totalImported = 0;
      let totalImportedWithoutImage = 0;
      let totalSkipped = 0;
      const allErrors: { filename: string; error: string }[] = [];

      // Si hay imágenes, enviamos en lotes por imagen coincidente.
      // Si no hay imágenes, enviamos el CSV entero de una vez.
      if (imageFiles.length > 0) {
        const matchedImages = imageFiles.filter((f) =>
          csvRows.some((r) => r.matched && r.filename.toLowerCase() === f.name.toLowerCase())
        );

        for (let i = 0; i < matchedImages.length; i += BATCH) {
          const batch = matchedImages.slice(i, i + BATCH);
          const form = new FormData();
          form.append("csv", csvFile);
          batch.forEach((f) => form.append("images", f));

          const res = await fetch("/api/import/photos", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error en el servidor");

          totalImported += data.imported ?? 0;
          totalImportedWithoutImage += data.importedWithoutImage ?? 0;
          totalSkipped += data.skipped ?? 0;
          if (data.errors) allErrors.push(...data.errors);

          setProgress(Math.round(((i + batch.length) / matchedImages.length) * 100));
        }
      } else {
        // Solo CSV: enviar todo de una vez
        const form = new FormData();
        form.append("csv", csvFile);
        setProgress(50);

        const res = await fetch("/api/import/photos", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error en el servidor");

        totalImported += data.imported ?? 0;
        totalImportedWithoutImage += data.importedWithoutImage ?? 0;
        totalSkipped += data.skipped ?? 0;
        if (data.errors) allErrors.push(...data.errors);
        setProgress(100);
      }

      setResult({ imported: totalImported, importedWithoutImage: totalImportedWithoutImage, skipped: totalSkipped, errors: allErrors });
      onImportSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setImporting(false);
    }
  };

  const canImport = !!csvFile && csvRows.length > 0 && !importing;

  return (
    <div className="space-y-6">
      {/* Aviso modo CSV-only */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <strong>Modo sin FTP:</strong> puedes importar solo el CSV para guardar los metadatos (año y descripción) sin subir imágenes. Las fotos se pueden añadir
        después cuando el FTP esté disponible.
      </div>

      {/* Paso 1: CSV */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">1. Archivo CSV <span className="text-red-500">*</span></h3>
          {csvFile && <span className="text-sm text-green-600 font-medium">✓ {csvFile.name}</span>}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Columnas requeridas: <code className="bg-gray-100 px-1 rounded">filename</code>, <code className="bg-gray-100 px-1 rounded">year</code>,{" "}
          <code className="bg-gray-100 px-1 rounded">description</code>. Usa <code className="bg-gray-100 px-1 rounded">Envio2Rehabilitacion/fotos.csv</code>.
        </p>
        <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvChange(f); }} />
        <button
          onClick={() => csvInputRef.current?.click()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          {csvFile ? "Cambiar CSV" : "Seleccionar CSV"}
        </button>
      </div>

      {/* Paso 2: Imágenes (opcional) */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-700">
            2. Imágenes <span className="text-xs font-normal text-gray-400">(opcional)</span>
          </h3>
          {imageFiles.length > 0 && <span className="text-sm text-green-600 font-medium">✓ {imageFiles.length} imágenes</span>}
        </div>
        <p className="text-xs text-gray-500 mb-3">Si las añades se subirán al FTP. Si no, los registros se crearán sin imagen.</p>
        <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) handleImagesChange(files); }} />
        <button
          onClick={() => imgInputRef.current?.click()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          {imageFiles.length > 0 ? "Cambiar imágenes" : "Seleccionar imágenes"}
        </button>
        {imageFiles.length > 0 && (
          <button onClick={() => { setImageFiles([]); if (csvFile) { const r = new FileReader(); r.onload = (e) => rebuildRows(e.target?.result as string, []); r.readAsText(csvFile, "utf-8"); } }}
            className="ml-2 px-4 py-2 text-sm text-red-600 hover:underline">
            Quitar imágenes
          </button>
        )}
      </div>

      {/* Preview */}
      {csvRows.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-3 mb-3 text-sm">
            <span className="text-gray-700 font-medium">{csvRows.length} filas en CSV</span>
            {imageFiles.length > 0 ? (
              <>
                <span className="text-green-600">✓ {matchedCount} con imagen</span>
                {unmatchedCount > 0 && <span className="text-amber-600">⚠ {unmatchedCount} sin imagen (se importarán sin foto)</span>}
              </>
            ) : (
              <span className="text-amber-600">⚠ Sin imágenes — se importarán solo los metadatos</span>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium w-8">Img</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Archivo</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium w-12">Año</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvRows.map((row, i) => (
                    <tr key={i} className="bg-white">
                      <td className="px-3 py-1.5 text-center text-gray-400">{row.matched ? <span className="text-green-500">✓</span> : "—"}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-700 truncate max-w-[180px]">{row.filename}</td>
                      <td className="px-3 py-1.5 text-gray-600">{row.year}</td>
                      <td className="px-3 py-1.5 text-gray-500 truncate max-w-xs">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Progreso */}
      {importing && (
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Importando...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className={`rounded-lg p-4 text-sm ${result.errors.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
          <p className="font-semibold text-gray-900 mb-1">✅ Importación completada</p>
          <ul className="space-y-0.5 text-gray-700">
            {result.imported > 0 && <li>Con imagen subida: {result.imported}</li>}
            {result.importedWithoutImage > 0 && <li>Solo metadatos (sin imagen): {result.importedWithoutImage}</li>}
            {result.skipped > 0 && <li className="text-gray-400">Omitidas: {result.skipped}</li>}
          </ul>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-red-600">
              {result.errors.map((e, i) => <li key={i}>❌ {e.filename}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={handleImport}
        disabled={!canImport}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {importing
          ? `Importando... ${progress}%`
          : csvRows.length > 0
          ? imageFiles.length > 0
            ? `Importar ${csvRows.length} registros (${matchedCount} con imagen)`
            : `Importar ${csvRows.length} registros (solo metadatos)`
          : "Selecciona un CSV para continuar"}
      </button>
    </div>
  );
}
