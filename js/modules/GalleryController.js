// js/modules/GalleryController.js — Controlador de la galería fotográfica

class GalleryController {
    /**
     * @param {HTMLElement} rootElement - Elemento raíz de la galería (.gallery)
     */
    constructor(rootElement) {
        this.root = rootElement;

        // ── Elementos del DOM ──────────────────────────────────────────────
        this._track    = this.root.querySelector('.gallery__track');
        this._slides   = Array.from(this.root.querySelectorAll('.gallery__slide'));
        this._btnPrev  = this.root.querySelector('.gallery__btn--prev');
        this._btnNext  = this.root.querySelector('.gallery__btn--next');
        this._dotsWrap = this.root.querySelector('.gallery__dots');

        // ── Estado privado (inmutable desde fuera) ─────────────────────────
        // Acceso de lectura expuesto solo via getter.
        let _index = 0;
        Object.defineProperty(this, 'currentIndex', {
            get: () => _index,
            set: (val) => {
                const total = this._slides.length;
                // Navegación circular: al pasar del último vuelve al primero y viceversa.
                _index = ((val % total) + total) % total;
                this._render();
            },
            enumerable: true,
            configurable: false,
        });

        // ── Inicialización ─────────────────────────────────────────────────
        this._buildDots();
        this._render(); // inyecta is-active en el slide inicial (index 0)
        this._mapEvents();
    }

    // ── Construcción dinámica de los indicadores (dots) ────────────────────
    _buildDots() {
        // Limpiar contenido HTML estático (el comentario del placeholder).
        this._dotsWrap.innerHTML = '';

        this._dots = this._slides.map((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gallery__dot';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            btn.dataset.index = i;
            this._dotsWrap.appendChild(btn);
            return btn;
        });
    }

    // ── Aplicar cross-fade y sincronizar estados ARIA / clases ────────────
    _render() {
        const idx = this.currentIndex;

        // Cross-fade: purgar is-active de todos los slides e inyectarlo
        // exclusivamente en el nodo cuyo índice coincida con currentIndex.
        this._slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === idx);
        });

        // Actualizar ARIA + clase activa en cada dot.
        this._dots.forEach((dot, i) => {
            const active = i === idx;
            dot.setAttribute('aria-selected', active ? 'true' : 'false');
            dot.classList.toggle('gallery__dot--active', active);
        });

        // Navegación circular pura: botones siempre activos.
        this._btnPrev.disabled = false;
        this._btnNext.disabled = false;
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        this.root.addEventListener('click', this._onClick.bind(this));
        this.root.addEventListener('keydown', this._onKeydown.bind(this));
        this.root.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: true });
        this.root.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: true });
    }

    // ── Handler: click ─────────────────────────────────────────────────────
    _onClick(event) {
        const target = event.target;

        // Botón anterior
        if (target.closest('.gallery__btn--prev')) {
            this.currentIndex = this.currentIndex - 1;
            return;
        }

        // Botón siguiente
        if (target.closest('.gallery__btn--next')) {
            this.currentIndex = this.currentIndex + 1;
            return;
        }

        // Dot: navegar al índice correspondiente
        const dot = target.closest('.gallery__dot');
        if (dot) {
            this.currentIndex = Number(dot.dataset.index);
        }
    }

    // ── Handler: teclado (accesibilidad) ───────────────────────────────────
    _onKeydown(event) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.currentIndex = this.currentIndex - 1;
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.currentIndex = this.currentIndex + 1;
        }
    }

    // ── Handlers: swipe táctil ─────────────────────────────────────────────
    _onTouchStart(event) {
        this._touchStartX = event.changedTouches[0].clientX;
    }

    _onTouchEnd(event) {
        const delta = event.changedTouches[0].clientX - this._touchStartX;
        const SWIPE_THRESHOLD = 50; // px mínimos para reconocer el gesto

        if (Math.abs(delta) < SWIPE_THRESHOLD) return;

        if (delta < 0) {
            // Swipe hacia la izquierda → siguiente
            this.currentIndex = this.currentIndex + 1;
        } else {
            // Swipe hacia la derecha → anterior
            this.currentIndex = this.currentIndex - 1;
        }
    }
}

export default GalleryController;