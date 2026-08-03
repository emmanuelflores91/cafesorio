// js/modules/IntroController.js — Controlador de la secuencia de introducción

class IntroController {
    /**
     * @param {string} coverSelector    - Selector CSS del nodo de estado cover   (ej. '#app-state-cover')
     * @param {string} introSelector    - Selector CSS del nodo de estado intro    (ej. '#app-state-intro')
     * @param {string} mainSelector     - Selector CSS del nodo de estado principal (ej. '#app-state-main')
     * @param {string} trackSelector    - Selector CSS del contenedor de slides     (ej. '.comic-track')
     * @param {string} startBtnSelector - Selector CSS del botón de inicio del cómic (ej. '#btn-start-comic')
     */
    constructor(coverSelector, introSelector, mainSelector, trackSelector, startBtnSelector) {
        this._nodeCover    = document.querySelector(coverSelector);
        this._nodeIntro    = document.querySelector(introSelector);
        this._nodeMain     = document.querySelector(mainSelector);
        this._nodeTrack    = document.querySelector(trackSelector);
        this._nodeStartBtn = document.querySelector(startBtnSelector);

        this._nodeBtnPrev  = document.querySelector('.comic-btn--prev');
        this._nodeBtnNext  = document.querySelector('.comic-btn--next');
        this._nodeDotsWrap = document.querySelector('.comic-dots'); // Mutación: Puntero al contenedor de dots
        this._nodeBtnHome  = document.querySelector('#btn-go-home');

        if (!this._nodeCover || !this._nodeIntro || !this._nodeMain || !this._nodeTrack) {
            console.warn('IntroController: fallo en la resolución de nodos requeridos.');
            return;
        }

        this._slides      = Array.from(this._nodeTrack.querySelectorAll('.comic-slide'));
        this._totalSlides = this._slides.length;

        this._currentIndex = 0;
        this._buildDots();   // Mutación: Inyección dinámica del modelo de dots
        this._renderState();
        this._mapEvents();
    }

    // ── Mutación: Construcción dinámica de nodos indicadores ──────────────
    _buildDots() {
        if (!this._nodeDotsWrap) return;
        this._nodeDotsWrap.innerHTML = ''; // Limpieza de estado residual

        this._dots = this._slides.map((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'comic-dot';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', `Ir a viñeta ${i + 1}`);
            btn.setAttribute('aria-selected', 'false');
            btn.dataset.index = i;
            this._nodeDotsWrap.appendChild(btn);
            return btn;
        });
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        if (this._nodeStartBtn) {
            this._nodeStartBtn.addEventListener('click', this._onStartClick.bind(this));
        }

        if (this._nodeBtnHome) {
            this._nodeBtnHome.addEventListener('click', this._goHome.bind(this));
        }

        // Delegación de eventos bidireccionales — stopPropagation evita
        // que el clic sobre el botón active también el handler del track.
        if (this._nodeBtnPrev) {
            this._nodeBtnPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                this._goPrev();
            });
        }

        if (this._nodeBtnNext) {
            this._nodeBtnNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this._goNext();
            });
        }

        // Fallback de navegación directa sobre el track principal
        this._nodeTrack.addEventListener('click', this._goNext.bind(this));

        // Mutación: Delegación de eventos para navegación arbitraria mediante dots
        if (this._nodeDotsWrap) {
            this._nodeDotsWrap.addEventListener('click', (e) => {
                const dot = e.target.closest('.comic-dot');
                if (dot) {
                    e.stopPropagation();
                    this._currentIndex = Number(dot.dataset.index);
                    this._renderState();
                }
            });
        }
    }

    // ── Handler: clic en #btn-start-comic ─────────────────────────────────
    _onStartClick() {
        this._nodeCover.classList.add('is-hidden');
        this._nodeIntro.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.remove('is-hidden');
    }

    // ── Transición direccional inversa ─────────────────────────────────────────
    _goPrev() {
        // Mutación: Transmutación al estado Cover si el índice es 0
        if (this._currentIndex === 0) {
            this._transitionToCover();
            return;
        }
        this._currentIndex -= 1;
        this._renderState();
    }

    // ── Transición direccional directa ─────────────────────────────────────
    _goNext() {
        if (this._currentIndex === this._totalSlides - 1) {
            this._transitionToMain();
            return;
        }
        this._currentIndex += 1;
        this._renderState();
    }

    // ── Motor de resolución de clases de estado CSS ────────────────────────
    _renderState() {
        // Renderizado del track de imágenes
        this._slides.forEach((slide, index) => {
            slide.classList.remove('is-active', 'is-past');

            if (index === this._currentIndex) {
                slide.classList.add('is-active');
            } else if (index < this._currentIndex) {
                slide.classList.add('is-past');
            }
            // index > this._currentIndex → sin clase → translateX(150vw) por defecto CSS
        });

        // Mutación: Sincronización de estado de indicadores (dots)
        if (this._dots) {
            this._dots.forEach((dot, index) => {
                const isActive = index === this._currentIndex;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }
    }

    // ── Mutación: Transición de estado global inversa (Intro → Cover) ──────────
    _transitionToCover() {
        this._nodeIntro.classList.add('is-hidden');
        this._nodeCover.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.add('is-hidden');
    }

    _goHome() {
        this._nodeMain.classList.add('is-hidden');
        this._nodeIntro.classList.add('is-hidden');
        this._nodeCover.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.add('is-hidden');
        this._currentIndex = 0;
        this._renderState();
    }

    // ── Transición de estado global directa (Intro → Main) ──────────────────
    _transitionToMain() {
        this._nodeIntro.classList.add('is-fading');
        setTimeout(() => {
            this._nodeIntro.classList.add('is-hidden');
            this._nodeIntro.classList.remove('is-fading');
            this._nodeMain.classList.remove('is-hidden');
            this._nodeMain.classList.add('is-fading-in');
            requestAnimationFrame(() => {
                this._nodeMain.classList.add('is-visible');
            });
            setTimeout(() => {
                this._nodeMain.classList.remove('is-fading-in', 'is-visible');
            }, 400);
        }, 400);
    }
}

export default IntroController;
