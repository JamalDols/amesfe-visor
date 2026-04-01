"use client";

import { useState, useRef } from "react";

interface BackupMeta {
  version?: number;
  exportedAt?: string;
  albums: unknown[];
  photos: unknown[];
}

interface ImportResult {
  albumsImported: number;
  albumsSkipped: number;
  photosImported: number;
  photosSkipped: number;
}

export default function DatabaseBackup({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<{ file: File; meta: BackupMeta } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/export/backup");
      if (!res.ok) throw new Error("Error al exportar la base de datos");

      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+?)"/)?.[1] ?? "amesfe-backup.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setImportResult(null);
    setPendingBackup(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupMeta;
        if (!Array.isArray(data.albums) || !Array.isArray(data.photos)) {
          setError("El archivo no tiene el formato de backup correcto");
          return;
        }
        setPendingBackup({ file, meta: data });
      } catch {
        setError("El archivo no es un JSON válido");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (!pendingBackup) return;
    setImporting(true);
    setError(null);

    try {
      const text = await pendingBackup.file.text();
      const res = await fetch("/api/import/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setImportResult(data as ImportResult);
      setPendingBackup(null);
      onImportSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        Exporta toda la base de datos (fotos y álbumes) a un archivo JSON. Puedes importarlo después para restaurar los metadatos sin perder datos existentes (los
        registros duplicados se omiten automáticamente).
      </p>

      {/* Exportar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-semibold text-blue-900 mb-1">Exportar base de datos</h3>
        <p className="text-sm text-blue-700 mb-4">Descarga un JSON con todos los álbumes y fotos (metadatos, no las imágenes).</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {exporting ? "Exportando..." : "📤 Exportar BD"}
        </button>
      </div>

      {/* Importar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Importar base de datos</h3>
        <p className="text-sm text-gray-600 mb-4">Restaura metadatos desde un archivo de backup JSON. Los registros ya existentes no se modifican.</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            // Reset para permitir seleccionar el mismo archivo otra vez
            e.target.value = "";
          }}
        />

        {!pendingBackup ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            📥 Seleccionar backup JSON
          </button>
        ) : (
          <div className="space-y-3">
            {/* Info del backup seleccionado */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-1">
              <p className="font-medium text-gray-900">{pendingBackup.file.name}</p>
              {pendingBackup.meta.exportedAt && (
                <p className="text-gray-500">Exportado: {new Date(pendingBackup.meta.exportedAt).toLocaleString("es-ES")}</p>
              )}
              <p className="text-gray-700">
                {pendingBackup.meta.albums.length} álbumes · {pendingBackup.meta.photos.length} fotos
              </p>
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ Los registros ya existentes no se modificarán. Solo se añadirán los nuevos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {importing ? "Importando..." : "✅ Confirmar importación"}
              </button>
              <button
                onClick={() => {
                  setPendingBackup(null);
                  setError(null);
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-green-800 mb-2">✅ Importación completada</p>
          <ul className="text-green-700 space-y-0.5">
            <li>Álbumes importados: {importResult.albumsImported} · omitidos: {importResult.albumsSkipped}</li>
            <li>Fotos importadas: {importResult.photosImported} · omitidas: {importResult.photosSkipped}</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}
    </div>
  );
}
