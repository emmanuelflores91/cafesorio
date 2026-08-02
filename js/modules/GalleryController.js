// js/modules/GalleryController.js — Controlador de la galería fotográfica

class GalleryController {
    /**
     * @param {HTMLElement} rootElement - Elemento raíz de la galería (.gallery-grid)
     */
    constructor(rootElement) {
        this.root = rootElement;

        // Mapeo de Nodos
        this._track    = this.root.querySelector('.gallery-grid__track');
        this._slides   = Array.from(this.root.querySelectorAll('.gallery-grid__slide'));
        this._btnPrev  = this.root.querySelector('.gallery-btn--prev');
        this._btnNext  = this.root.querySelector('.gallery-btn--next');
        this._dotsWrap = this.root.querySelector('.gallery-grid__dots');

        if (!this._track || this._slides.length === 0) return;

        this._currentIndex = 0;
        this._totalSlides  = this._slides.length;

        this._buildDots();
        this._renderState();
        this._mapEvents();
    }

    // ── Construcción dinámica de indicadores (dots) ────────────────────────
    _buildDots() {
        if (!this._dotsWrap) return;
        this._dotsWrap.innerHTML = '';

        this._dots = this._slides.map((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'comic-dot';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            btn.setAttribute('aria-selected', 'false');
            btn.dataset.index = i;
            this._dotsWrap.appendChild(btn);
            return btn;
        });
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        if (this._btnPrev) {
            this._btnPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                this._goPrev();
            });
        }

        if (this._btnNext) {
            this._btnNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this._goNext();
            });
        }

        this._track.addEventListener('click', this._goNext.bind(this));

        if (this._dotsWrap) {
            this._dotsWrap.addEventListener('click', (e) => {
                const dot = e.target.closest('.comic-dot');
                if (dot) {
                    e.stopPropagation();
                    this._currentIndex = Number(dot.dataset.index);
                    this._renderState();
                }
            });
        }
    }

    // ── Transición direccional inversa (no circular) ──────────────────────
    _goPrev() {
        if (this._currentIndex === 0) return;
        this._currentIndex -= 1;
        this._renderState();
    }

    // ── Transición direccional directa (no circular) ──────────────────────
    _goNext() {
        if (this._currentIndex === this._totalSlides - 1) return;
        this._currentIndex += 1;
        this._renderState();
    }

    // ── Motor de resolución de clases de estado CSS ────────────────────────
    _renderState() {
        // Cinemática de desplazamiento interpolada
        this._slides.forEach((slide, index) => {
            slide.classList.remove('is-active', 'is-past');

            if (index === this._currentIndex) {
                slide.classList.add('is-active');
            } else if (index < this._currentIndex) {
                slide.classList.add('is-past');
            }
            // index > this._currentIndex → sin clase → translateX(100vw) por defecto CSS
        });

        // Orquestación de botones limitadores
        if (this._btnPrev) this._btnPrev.disabled = this._currentIndex === 0;
        if (this._btnNext) this._btnNext.disabled = this._currentIndex === this._totalSlides - 1;

        // Mutación de estado en nodos de paginación
        if (this._dots) {
            this._dots.forEach((dot, index) => {
                const isActive = index === this._currentIndex;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }
    }
}

export default GalleryController;