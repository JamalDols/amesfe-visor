"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { Photo } from "@/types";
import PhotoEditModal from "./PhotoEditModal";

interface Album { id: string; name: string; }
interface PhotoGalleryProps { refreshTrigger: number; showUnassigned?: boolean; }

interface DragRect {
  left: number; top: number; width: number; height: number;
  absLeft: number; absTop: number; absRight: number; absBottom: number;
}

const DRAG_THRESHOLD = 6;

export default function PhotoGallery({ refreshTrigger, showUnassigned = false }: PhotoGalleryProps) {
  const [photos, setPhotos]             = useState<Photo[]>([]);
  const [loading, setLoading]           = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [brokenPhotos, setBrokenPhotos]     = useState<Set<string>>(new Set());
  const [albums, setAlbums]             = useState<Album[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [selRect, setSelRect]           = useState<DragRect | null>(null);

  // Refs para rubber-band y shift+click
  const gridRef         = useRef<HTMLDivElement>(null);
  const photoRefs       = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragStart       = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const dragging        = useRef(false);   // superó el umbral
  const justDragged     = useRef(false);   // para suprimir onClick tras drag
  const lastClickedIdx  = useRef<number | null>(null);

  // ── Cargar datos ─────────────────────────────────────────────────────────

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const result = showUnassigned
        ? await apiClient.getPhotos({ unassigned: true })
        : await apiClient.getPhotos();
      setPhotos(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [showUnassigned]);

  const fetchAlbums = useCallback(async () => {
    try { setAlbums(await apiClient.getAlbums()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchPhotos(); fetchAlbums(); }, [fetchPhotos, fetchAlbums, refreshTrigger]);

  // Marcar como rotas las fotos sin image_url al cargar
  useEffect(() => {
    setBrokenPhotos(new Set(photos.filter((p) => !p.image_url).map((p) => p.id)));
  }, [photos]);

  // ── Selección ─────────────────────────────────────────────────────────────

  const markBroken = (id: string) =>
    setBrokenPhotos((prev) => { const s = new Set(prev); s.add(id); return s; });

  const togglePhoto = (id: string) =>
    setSelectedPhotos((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const selectRange = (fromIdx: number, toIdx: number) => {
    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    setSelectedPhotos((prev) => {
      const s = new Set(prev);
      photos.slice(lo, hi + 1).forEach((p) => s.add(p.id));
      return s;
    });
  };

  const selectAll    = () => setSelectedPhotos(new Set(photos.map((p) => p.id)));
  const selectBroken = () => setSelectedPhotos(new Set(brokenPhotos));
  const clearSel     = () => setSelectedPhotos(new Set());

  // ── Clic en foto (toggle / shift+range) ──────────────────────────────────

  const handlePhotoClick = (e: React.MouseEvent, photo: Photo, idx: number) => {
    if (justDragged.current) { justDragged.current = false; return; }

    if (e.shiftKey && lastClickedIdx.current !== null) {
      selectRange(lastClickedIdx.current, idx);
    } else {
      togglePhoto(photo.id);
      lastClickedIdx.current = idx;
    }
  };

  // ── Rubber-band ───────────────────────────────────────────────────────────

  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = gridRef.current!.getBoundingClientRect();
    dragStart.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
    };
    dragging.current = false;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dx = curX - dragStart.current.x;
      const dy = curY - dragStart.current.y;

      if (!dragging.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        dragging.current = true;
      }
      if (!dragging.current) return;

      const left   = Math.min(dragStart.current.x, curX);
      const top    = Math.min(dragStart.current.y, curY);
      const width  = Math.abs(dx);
      const height = Math.abs(dy);
      setSelRect({
        left, top, width, height,
        absLeft:   Math.min(e.clientX, dragStart.current.clientX),
        absTop:    Math.min(e.clientY, dragStart.current.clientY),
        absRight:  Math.max(e.clientX, dragStart.current.clientX),
        absBottom: Math.max(e.clientY, dragStart.current.clientY),
      });
    };

    const onUp = () => {
      if (!dragStart.current) return;

      if (dragging.current) {
        justDragged.current = true;
        // Seleccionar todas las fotos que se solapan con el rectángulo
        setSelRect((rect) => {
          if (rect) {
            const newSel = new Set<string>();
            photoRefs.current.forEach((el, id) => {
              const r = el.getBoundingClientRect();
              if (r.left < rect.absRight && r.right > rect.absLeft &&
                  r.top  < rect.absBottom && r.bottom > rect.absTop) {
                newSel.add(id);
              }
            });
            if (newSel.size > 0) {
              setSelectedPhotos((prev) => { const s = new Set(prev); newSel.forEach((id) => s.add(id)); return s; });
            }
          }
          return null;
        });
      }

      dragStart.current = null;
      dragging.current  = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Borrar ────────────────────────────────────────────────────────────────

  const deletePhoto = async (id: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    try { await apiClient.deletePhoto(id); fetchPhotos(); }
    catch { alert("Error al eliminar"); }
  };

  const deleteSelected = async () => {
    if (!selectedPhotos.size) return;
    if (!confirm(`¿Eliminar ${selectedPhotos.size} foto(s)? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    let ok = 0, fail = 0;
    for (const id of selectedPhotos) {
      try { await apiClient.deletePhoto(id); ok++; }
      catch { fail++; }
    }
    setDeleting(false);
    clearSel();
    await fetchPhotos();
    if (fail) alert(`Eliminadas: ${ok}. Errores: ${fail}.`);
  };

  // ── Mover ─────────────────────────────────────────────────────────────────

  const moveToAlbum = async (albumId: string | null) => {
    if (!selectedPhotos.size) return;
    try {
      await apiClient.updatePhotosAlbum(Array.from(selectedPhotos), albumId);
      await fetchPhotos(); clearSel(); setShowMoveModal(false);
    } catch { alert("Error al mover"); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 select-none">

      {/* Cabecera */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          {showUnassigned ? "Fotos sin álbum" : "Fotos Subidas"} ({photos.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {brokenPhotos.size > 0 && (
            <button onClick={selectBroken}
              className="px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm hover:bg-red-200 transition-colors">
              ⚠️ Seleccionar rotas ({brokenPhotos.size})
            </button>
          )}
          <button onClick={selectAll}
            className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            Seleccionar todas
          </button>
          {selectedPhotos.size > 0 && (
            <button onClick={clearSel}
              className="px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              Limpiar ({selectedPhotos.size})
            </button>
          )}
          <button onClick={fetchPhotos}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Actualizar
          </button>
        </div>
      </div>

      {/* Barra de acciones */}
      {selectedPhotos.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-wrap items-center gap-3">
          <span className="text-blue-800 font-medium text-sm">{selectedPhotos.size} seleccionada(s)</span>
          <button onClick={() => { fetchAlbums(); setShowMoveModal(true); }}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
            Mover a álbum
          </button>
          <button onClick={deleteSelected} disabled={deleting}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {deleting ? "Eliminando…" : "🗑️ Eliminar seleccionadas"}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">
        Clic para seleccionar · <kbd className="bg-gray-100 px-1 rounded">Shift</kbd>+clic para rango · Arrastra para seleccionar varias
      </p>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 cursor-crosshair"
        onMouseDown={handleGridMouseDown}
      >
        {/* Rectángulo de selección */}
        {selRect && (
          <div className="pointer-events-none absolute z-30 border-2 border-blue-500 bg-blue-200/25 rounded"
            style={{ left: selRect.left, top: selRect.top, width: selRect.width, height: selRect.height }} />
        )}

        {photos.map((photo, idx) => {
          const isSelected = selectedPhotos.has(photo.id);
          const isBroken   = brokenPhotos.has(photo.id);

          return (
            <div
              key={photo.id}
              data-photo={photo.id}
              ref={(el) => { if (el) photoRefs.current.set(photo.id, el); else photoRefs.current.delete(photo.id); }}
              className={`relative group rounded-lg overflow-hidden transition-all cursor-pointer
                ${isSelected ? "ring-[3px] ring-blue-500 ring-offset-1 brightness-90" : ""}
                ${isBroken && !isSelected ? "ring-2 ring-red-400" : ""}
              `}
              onClick={(e) => handlePhotoClick(e, photo, idx)}
            >
              {/* Checkbox */}
              <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white/80 border-gray-400 opacity-0 group-hover:opacity-100"}`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Imagen o placeholder de rota */}
              {isBroken ? (
                <div className="w-full h-32 bg-red-50 flex flex-col items-center justify-center text-red-400 border border-red-200 rounded-lg">
                  <svg className="w-7 h-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span className="text-xs">Sin imagen</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.image_url} alt={photo.description || "Foto"}
                  className="w-full h-32 object-cover"
                  onError={() => markBroken(photo.id)} />
              )}

              {/* Botones hover (editar / eliminar) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setEditingPhoto(photo); }}
                    className="bg-white/90 text-blue-600 p-1.5 rounded-full hover:bg-white shadow"
                    title="Editar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                    className="bg-white/90 text-red-600 p-1.5 rounded-full hover:bg-white shadow"
                    title="Eliminar">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Metadatos — siempre visible */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/75 to-transparent text-white text-xs px-2 py-2 pointer-events-none">
                {photo.year
                  ? <p className="font-semibold leading-tight">{photo.year}</p>
                  : <p className="opacity-40 italic leading-tight">Sin año</p>
                }
                {photo.description
                  ? <p className="truncate opacity-90 leading-tight">{photo.description}</p>
                  : <p className="opacity-40 italic leading-tight">Sin descripción</p>
                }
              </div>
            </div>
          );
        })}
      </div>

      {photos.length === 0 && <p className="text-center text-gray-400 py-12">No hay fotos</p>}

      {/* Modal editar */}
      {editingPhoto && (
        <PhotoEditModal photo={editingPhoto} isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={() => { setEditingPhoto(null); fetchPhotos(); }} />
      )}

      {/* Modal mover */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mover {selectedPhotos.size} foto(s) a álbum</h3>
            <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
              <button onClick={() => moveToAlbum(null)}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-700">Sin álbum</div>
                <div className="text-xs text-gray-400">Quitar de cualquier álbum</div>
              </button>
              {albums.map((a) => (
                <button key={a.id} onClick={() => moveToAlbum(a.id)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <div className="font-medium">{a.name}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoveModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
