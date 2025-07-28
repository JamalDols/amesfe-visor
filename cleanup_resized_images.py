#!/usr/bin/env python3
"""
Script para limpiar imágenes redimensionadas automáticamente.

Elimina todas las versiones redimensionadas de imágenes (ej: imagen-300x200.jpg)
y mantiene solo la versión original (ej: imagen.jpg).

Uso:
    python cleanup_resized_images.py /ruta/a/carpeta

Ejemplos de archivos que se eliminarán:
- IMG-20250116-WA0001-150x150.jpg
- IMG-20250116-WA0001-300x225.jpg  
- 12_18_2008_004-1080x675.jpeg
- photo-768x576.png

Archivos que se mantendrán:
- IMG-20250116-WA0001.jpg
- 12_18_2008_004.jpeg
- photo.png
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

class ImageCleaner:
    def __init__(self):
        # Patrón para detectar imágenes redimensionadas
        # Busca: nombre-WIDTHxHEIGHT.extensión
        self.resized_pattern = re.compile(
            r'^(.+?)-(\d+x\d+)\.([a-zA-Z0-9]+)$',
            re.IGNORECASE
        )
        
        # Extensiones de imagen válidas
        self.image_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', 
            '.tiff', '.tif', '.webp', '.svg'
        }
        
        self.deleted_files = []
        self.kept_files = []
        self.errors = []

    def is_image_file(self, filename: str) -> bool:
        """Verifica si el archivo es una imagen válida."""
        return Path(filename).suffix.lower() in self.image_extensions

    def parse_filename(self, filename: str) -> Tuple[str, str, bool]:
        """
        Analiza un nombre de archivo y determina si es una imagen redimensionada.
        
        Returns:
            tuple: (nombre_base, extension, es_redimensionada)
        """
        if not self.is_image_file(filename):
            return filename, "", False
            
        match = self.resized_pattern.match(filename)
        if match:
            base_name = match.group(1)
            dimensions = match.group(2)
            extension = match.group(3)
            return f"{base_name}.{extension}", extension, True
        
        return filename, Path(filename).suffix[1:], False

    def get_original_filename(self, resized_filename: str) -> str:
        """Obtiene el nombre del archivo original a partir del redimensionado."""
        original, _, _ = self.parse_filename(resized_filename)
        return original

    def scan_directory(self, directory_path: str) -> List[Tuple[str, str, bool]]:
        """
        Escanea un directorio y sus subdirectorios buscando imágenes.
        
        Returns:
            List de tuplas: (ruta_completa, nombre_original, es_redimensionada)
        """
        files_info = []
        
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                if self.is_image_file(file):
                    full_path = os.path.join(root, file)
                    original_name, _, is_resized = self.parse_filename(file)
                    files_info.append((full_path, original_name, is_resized))
                    
        return files_info

    def group_files_by_original(self, files_info: List[Tuple[str, str, bool]]) -> dict:
        """
        Agrupa archivos por su nombre original.
        
        Returns:
            dict: {nombre_original: {'originals': [rutas], 'resized': [rutas]}}
        """
        groups = {}
        
        for full_path, original_name, is_resized in files_info:
            directory = os.path.dirname(full_path)
            original_key = os.path.join(directory, original_name)
            
            if original_key not in groups:
                groups[original_key] = {'originals': [], 'resized': []}
                
            if is_resized:
                groups[original_key]['resized'].append(full_path)
            else:
                groups[original_key]['originals'].append(full_path)
                
        return groups

    def clean_directory(self, directory_path: str, dry_run: bool = False) -> None:
        """
        Limpia un directorio eliminando imágenes redimensionadas.
        
        Args:
            directory_path: Ruta del directorio a limpiar
            dry_run: Si es True, solo muestra qué se haría sin eliminar archivos
        """
        if not os.path.exists(directory_path):
            print(f"❌ Error: El directorio '{directory_path}' no existe.")
            return
            
        print(f"🔍 Escaneando: {directory_path}")
        files_info = self.scan_directory(directory_path)
        
        if not files_info:
            print("ℹ️  No se encontraron imágenes en el directorio.")
            return
            
        groups = self.group_files_by_original(files_info)
        
        print(f"\n📊 Resumen del escaneo:")
        print(f"   • Total de imágenes encontradas: {len(files_info)}")
        print(f"   • Grupos de imágenes: {len(groups)}")
        
        to_delete = []
        
        for original_path, file_group in groups.items():
            originals = file_group['originals']
            resized = file_group['resized']
            
            if resized:  # Solo procesar si hay versiones redimensionadas
                if originals:
                    # Hay archivo original, eliminar las versiones redimensionadas
                    to_delete.extend(resized)
                    self.kept_files.extend(originals)
                    
                    print(f"\n✅ {os.path.basename(original_path)}")
                    print(f"   Mantener: {len(originals)} original(es)")
                    print(f"   Eliminar: {len(resized)} redimensionada(s)")
                    
                else:
                    # No hay archivo original, mantener la versión de mayor resolución
                    largest_file = max(resized, key=lambda x: os.path.getsize(x))
                    to_delete.extend([f for f in resized if f != largest_file])
                    self.kept_files.append(largest_file)
                    
                    print(f"\n⚠️  {os.path.basename(original_path)} (sin original)")
                    print(f"   Mantener: {os.path.basename(largest_file)} (mayor tamaño)")
                    print(f"   Eliminar: {len(resized) - 1} versión(es)")
        
        if not to_delete:
            print("\n✨ No hay archivos redimensionados para eliminar.")
            return
            
        print(f"\n📋 Resumen de acciones:")
        print(f"   • Archivos a eliminar: {len(to_delete)}")
        print(f"   • Archivos a mantener: {len(self.kept_files)}")
        
        if dry_run:
            print(f"\n🔍 MODO SIMULACIÓN - Archivos que se eliminarían:")
            for file_path in to_delete:
                print(f"   🗑️  {file_path}")
        else:
            print(f"\n🗑️  Eliminando archivos...")
            for file_path in to_delete:
                try:
                    os.remove(file_path)
                    self.deleted_files.append(file_path)
                    print(f"   ✅ Eliminado: {os.path.basename(file_path)}")
                except Exception as e:
                    error_msg = f"Error eliminando {file_path}: {str(e)}"
                    self.errors.append(error_msg)
                    print(f"   ❌ {error_msg}")
        
        self._print_final_summary(dry_run)

    def _print_final_summary(self, dry_run: bool) -> None:
        """Imprime el resumen final de la operación."""
        print(f"\n{'='*60}")
        print(f"📊 RESUMEN FINAL")
        print(f"{'='*60}")
        
        if dry_run:
            print(f"🔍 Modo simulación - No se eliminaron archivos")
            print(f"📁 Archivos que se eliminarían: {len(self.deleted_files) + len([f for f in self.errors])}")
        else:
            print(f"✅ Archivos eliminados exitosamente: {len(self.deleted_files)}")
            print(f"📁 Archivos mantenidos: {len(self.kept_files)}")
            
        if self.errors:
            print(f"❌ Errores encontrados: {len(self.errors)}")
            for error in self.errors:
                print(f"   • {error}")

def main():
    if len(sys.argv) < 2:
        print("Uso: python cleanup_resized_images.py <directorio> [--dry-run]")
        print("\nOpciones:")
        print("  --dry-run    Simula la operación sin eliminar archivos")
        print("\nEjemplos:")
        print("  python cleanup_resized_images.py /ruta/a/fotos")
        print("  python cleanup_resized_images.py /ruta/a/fotos --dry-run")
        sys.exit(1)
    
    directory = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    cleaner = ImageCleaner()
    
    print("🧹 LIMPIADOR DE IMÁGENES REDIMENSIONADAS")
    print("="*50)
    
    if dry_run:
        print("🔍 MODO SIMULACIÓN ACTIVADO")
        print("   No se eliminarán archivos realmente")
        print()
    
    try:
        cleaner.clean_directory(directory, dry_run)
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario.")
    except Exception as e:
        print(f"\n❌ Error inesperado: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
