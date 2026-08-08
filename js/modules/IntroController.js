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
        this._nodeBtnBackToLastComic = document.querySelector('#btn-back-to-last-comic');
        this._nodeComicControls = document.querySelector('.comic-controls');
        this._nodeComicZoom      = document.querySelector('.comic-zoom');
        this._nodeComicZoomImg   = this._nodeComicZoom ? this._nodeComicZoom.querySelector('.gallery-grid__zoom-img') : null;
        this._nodeComicZoomClose = this._nodeComicZoom ? this._nodeComicZoom.querySelector('.gallery-grid__zoom-close') : null;

        if (!this._nodeCover || !this._nodeIntro || !this._nodeMain || !this._nodeTrack) {
            console.warn('IntroController: fallo en la resolución de nodos requeridos.');
            return;
        }

        this._slides      = Array.from(this._nodeTrack.querySelectorAll('.comic-slide'));
        this._totalSlides = this._slides.length + 1;

        this._currentIndex = 0;
        this._buildDots();   // Mutación: Inyección dinámica del modelo de dots
        this._renderState();
        this._mapEvents();
    }

    // ── Mutación: Construcción dinámica de nodos indicadores ──────────────
    _buildDots() {
        if (!this._nodeDotsWrap) return;
        this._nodeDotsWrap.innerHTML = ''; // Limpieza de estado residual

        this._dots = [];
        for (let i = 0; i < this._totalSlides; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'comic-dot';
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', `Ir a viñeta ${i + 1}`);
            btn.setAttribute('aria-selected', 'false');
            btn.dataset.index = i;
            this._nodeDotsWrap.appendChild(btn);
            this._dots.push(btn);
        }
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        if (this._nodeStartBtn) {
            this._nodeStartBtn.addEventListener('click', this._onStartClick.bind(this));
        }

        if (this._nodeBtnHome) {
            this._nodeBtnHome.addEventListener('click', this._goHome.bind(this));
        }

        if (this._nodeBtnBackToLastComic) {
            this._nodeBtnBackToLastComic.addEventListener('click', this._goToLastComic.bind(this));
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

        // Navegación por teclado: flecha derecha avanza, flecha izquierda retrocede.
        // Actúa si la vista intro o la vista main están activas; se bloquea
        // únicamente cuando ambas están ocultas (es decir, estamos en cover).
        document.addEventListener('keydown', (e) => {
            const introHidden = this._nodeIntro.classList.contains('is-hidden');
            const mainHidden = this._nodeMain.classList.contains('is-hidden');
            if (introHidden && mainHidden) return;
            if (e.key === 'ArrowRight') {
                this._goNext();
            } else if (e.key === 'ArrowLeft') {
                this._goPrev();
            }
        });

        // Navegación táctil (swipe) sobre el track de imágenes.
        // Swipe derecha→izquierda avanza, swipe izquierda→derecha retrocede.
        // Umbral mínimo de 50px para distinguir un swipe real de un tap;
        // si no se supera el umbral, no se interviene y el click de fallback
        // existente sobre _nodeTrack sigue manejando el tap normalmente.
        this._touchStartX = 0;
        this._touchStartY = 0;
        const SWIPE_THRESHOLD = 50;

        this._nodeTrack.addEventListener('touchstart', (e) => {
            this._touchStartX = e.changedTouches[0].screenX;
            this._touchStartY = e.changedTouches[0].screenY;
        });

        this._lastComicTapTime = 0;
        const DOUBLE_TAP_THRESHOLD = 300;

        this._nodeTrack.addEventListener('touchend', (e) => {
            if (this._nodeComicZoom && !this._nodeComicZoom.classList.contains('is-hidden')) return;

            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const deltaX = touchEndX - this._touchStartX;
            const deltaY = touchEndY - this._touchStartY;

            if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                e.stopPropagation();
                if (deltaX < 0) {
                    this._goNext();
                } else {
                    this._goPrev();
                }
                return;
            }

            const now = Date.now();
            const isTap = Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10;
            if (isTap) {
                if (now - this._lastComicTapTime < DOUBLE_TAP_THRESHOLD) {
                    e.stopPropagation();
                    const slide = e.target.closest('.comic-slide');
                    if (slide) {
                        this._openComicZoom(slide);
                    }
                    this._lastComicTapTime = 0;
                } else {
                    this._lastComicTapTime = now;
                }
            }
        });

        if (this._nodeComicZoomClose) {
            this._nodeComicZoomClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this._closeComicZoom();
            });
        }

        // Navegación táctil (swipe) sobre la vista principal.
        // Swipe izquierda→derecha retrocede al estado anterior.
        this._mainTouchStartX = 0;
        this._mainTouchStartY = 0;

        this._nodeMain.addEventListener('touchstart', (e) => {
            this._mainTouchStartX = e.changedTouches[0].screenX;
            this._mainTouchStartY = e.changedTouches[0].screenY;
        });

        this._nodeMain.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const deltaX = touchEndX - this._mainTouchStartX;
            const deltaY = touchEndY - this._mainTouchStartY;

            if (deltaX > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                e.stopPropagation();
                this._goPrev();
            }
        });
    }

    // ── Handler: clic en #btn-start-comic ─────────────────────────────────
    _onStartClick() {
        this._nodeCover.classList.add('is-hidden');
        this._nodeIntro.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.remove('is-hidden');
        if (this._nodeComicControls) this._nodeComicControls.classList.remove('is-hidden');
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
        if (this._currentIndex === this._totalSlides - 1) return;
        this._currentIndex += 1;
        this._renderState();
    }

    // ── Motor de resolución de clases de estado CSS ────────────────────────
    _renderState() {
        // Bugfix: solo se puede tocar la visibilidad de intro/main si el
        // usuario ya arrancó el recorrido (cover oculto). Evita que la
        // llamada inicial desde el constructor destape #app-state-intro
        // antes de tocar el botón de inicio.
        const introStarted = this._nodeCover.classList.contains('is-hidden');

        if (this._currentIndex < this._slides.length) {
            if (introStarted) {
                this._nodeIntro.classList.remove('is-hidden');
                this._nodeMain.classList.add('is-hidden');
                if (this._nodeComicControls) this._nodeComicControls.classList.remove('comic-controls--main-state');
            }
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
        } else if (this._currentIndex === this._slides.length) {
            if (introStarted) {
                this._nodeIntro.classList.add('is-fading-out');
                this._nodeIntro.addEventListener('transitionend', () => {
                    this._nodeIntro.classList.add('is-hidden');
                    this._nodeIntro.classList.remove('is-fading-out');
                }, { once: true });

                this._nodeMain.classList.remove('is-hidden');
                this._nodeMain.style.opacity = '0';
                requestAnimationFrame(() => {
                    this._nodeMain.style.opacity = '1';
                });

                if (this._nodeComicControls) this._nodeComicControls.classList.add('comic-controls--main-state');
            }
        }

        // Mutación: Sincronización de estado de indicadores (dots)
        if (this._dots) {
            this._dots.forEach((dot, index) => {
                const isActive = index === this._currentIndex;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }

        if (this._nodeBtnBackToLastComic) {
            this._nodeBtnBackToLastComic.classList.toggle('is-hidden', this._nodeMain.classList.contains('is-hidden'));
        }

        if (this._nodeBtnNext) {
            this._nodeBtnNext.disabled = (this._currentIndex === this._totalSlides - 1);
        }
    }

    // ── Zoom de viñeta a pantalla completa (double-tap) ─────────────────────
    _openComicZoom(slide) {
        if (!this._nodeComicZoom || !this._nodeComicZoomImg) return;
        this._nodeComicZoomImg.src = slide.src;
        this._nodeComicZoomImg.alt = slide.alt;
        this._nodeComicZoomImg.style.objectFit = 'contain';
        this._nodeComicZoom.classList.remove('is-hidden');
        requestAnimationFrame(() => {
            this._nodeComicZoom.classList.add('is-visible');
        });
    }

    _closeComicZoom() {
        if (!this._nodeComicZoom) return;
        this._nodeComicZoom.classList.remove('is-visible');
        this._nodeComicZoom.addEventListener('transitionend', () => {
            this._nodeComicZoom.classList.add('is-hidden');
        }, { once: true });
    }

    // ── Mutación: Transición de estado global inversa (Intro → Cover) ──────────
    _transitionToCover() {
        this._nodeIntro.classList.add('is-hidden');
        this._nodeCover.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.add('is-hidden');
        if (this._nodeComicControls) this._nodeComicControls.classList.add('is-hidden');
    }

    _goHome() {
        this._nodeMain.classList.add('is-hidden');
        this._nodeIntro.classList.add('is-hidden');
        this._nodeCover.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.add('is-hidden');
        if (this._nodeComicControls) this._nodeComicControls.classList.add('is-hidden');
        this._currentIndex = 0;
        this._renderState();
    }

    _goToLastComic() {
        this._currentIndex = this._slides.length - 1;
        this._renderState();
    }


}

export default IntroController;
