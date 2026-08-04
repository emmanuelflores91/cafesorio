// js/modules/GalleryController.js — Controlador de zoom de la galería fotográfica

class GalleryController {
    /**
     * @param {HTMLElement} rootElement - Elemento raíz de la galería (.gallery-grid)
     */
    constructor(rootElement) {
        this._nodeRoot      = rootElement;
        this._nodeTrack     = rootElement.querySelector('.gallery-grid__track');
        this._nodeZoom      = rootElement.querySelector('.gallery-grid__zoom');
        this._nodeZoomImg   = rootElement.querySelector('.gallery-grid__zoom-img');
        this._nodeZoomClose = rootElement.querySelector('.gallery-grid__zoom-close');

        if (!this._nodeTrack || !this._nodeZoom || !this._nodeZoomImg || !this._nodeZoomClose) {
            console.warn('GalleryController: fallo en la resolución de nodos requeridos.');
            return;
        }

        this._slides = Array.from(this._nodeTrack.querySelectorAll('.gallery-grid__slide'));
        this._mapEvents();
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        this._slides.forEach((slide) => {
            slide.addEventListener('click', () => this._openZoom(slide));
        });

        this._nodeZoomClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this._closeZoom();
        });
    }

    // ── Abrir imagen ampliada ──────────────────────────────────────────────
    _openZoom(slide) {
        this._nodeZoomImg.src = slide.src;
        this._nodeZoomImg.alt = slide.alt;
        this._nodeZoom.classList.remove('is-hidden');
    }

    // ── Cerrar imagen ampliada ─────────────────────────────────────────────
    _closeZoom() {
        this._nodeZoom.classList.add('is-hidden');
    }
}

export default GalleryController;