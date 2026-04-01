#!/usr/bin/env node
/**
 * Genera fotos.csv a partir de fotos.txt + los nombres reales de los archivos.
 * Uso: node scripts/generate-csv.js
 */

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../Envio2Rehabilitacion");
const INPUT = path.join(DIR, "fotos.txt");
const OUTPUT = path.join(DIR, "fotos.csv");

const rawText = fs.readFileSync(INPUT, "utf-8");

// Obtener lista de archivos jpg reales (sin extensión, en minúsculas para comparar)
const jpgFiles = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".jpg"));

// Escapar valor para CSV
function csvField(value) {
  const clean = (value || "").replace(/\r?\n/g, " ").replace(/"/g, '""').trim();
  return `"${clean}"`;
}

// Extraer año de los primeros 4 dígitos del nombre de archivo
function extractYear(filename) {
  const match = filename.match(/^(\d{4})/);
  return match ? match[1] : "";
}

/**
 * Para cada archivo jpg, busca su descripción en fotos.txt.
 * Estrategia: buscar el identificador (nombre sin .jpg) dentro de las líneas del txt,
 * y extraer el texto que sigue después del identificador.
 */
const rows = [];

for (const filename of jpgFiles.sort()) {
  const stem = filename.slice(0, -4); // quitar .jpg
  const stemLower = stem.toLowerCase();

  // Buscar la línea del txt que contenga este identificador
  // Buscamos ignorando mayúsculas/minúsculas
  const lines = rawText.split(/\n/);
  let description = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    const idx = lineLower.indexOf(stemLower);
    if (idx === -1) continue;

    // Verificar que sea una línea que empieza con "Fotografía" o año + "Fotografía"
    if (!line.match(/Fotograf[ií]a/i) && !line.match(/^\d{4}\s/)) continue;

    // Extraer todo lo que sigue al identificador en esa línea
    const afterStem = line.slice(idx + stem.length).trim();
    // Limpiar separadores iniciales (: . _ -)
    description = afterStem.replace(/^[\s:._\-]+/, "").trim();

    // Si la descripción está vacía, tomar la siguiente línea no vacía
    if (!description && i + 1 < lines.length) {
      description = lines[i + 1].trim();
    }
    break;
  }

  rows.push({ filename, year: extractYear(filename), description });
}

// Construir CSV
const csvLines = ["filename,year,description"];
for (const row of rows) {
  csvLines.push(`${csvField(row.filename)},${csvField(row.year)},${csvField(row.description)}`);
}

fs.writeFileSync(OUTPUT, csvLines.join("\n") + "\n", "utf-8");
console.log(`✅ CSV generado: ${OUTPUT}`);
console.log(`   ${rows.length} filas`);

// Mostrar las primeras 5 para verificar
console.log("\nPrimeras 5 filas:");
csvLines.slice(1, 6).forEach((l) => console.log(" ", l));
