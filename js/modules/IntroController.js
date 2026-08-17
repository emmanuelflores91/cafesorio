// js/modules/IntroController.js — Controlador de la secuencia de introducción

// Niveles fijos de zoom de viñeta (desktop). Editar este array es suficiente
// para cambiar los pasos: el primero es siempre el 100% y el último el máximo.
const COMIC_ZOOM_LEVELS = [1, 1.5, 2, 2.5];

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
        this._nodeComicFirstHint = this._nodeTrack ? this._nodeTrack.querySelector('.comic-slide--first .comic-slide__hint') : null;
        this._comicHintTimer     = null;
        this._nodeRotateHint     = document.querySelector('.rotate-hint');
        this._nodeRotateHintBtn  = document.querySelector('.rotate-hint__btn');

        if (!this._nodeCover || !this._nodeIntro || !this._nodeMain || !this._nodeTrack) {
            console.warn('IntroController: fallo en la resolución de nodos requeridos.');
            return;
        }

        this._slides      = Array.from(this._nodeTrack.querySelectorAll('.comic-slide'));
        this._totalSlides = this._slides.length + 1;

        this._currentIndex = 0;
        this._buildDots();   // Mutación: Inyección dinámica del modelo de dots
        this._buildComicZoom(); // Controles de zoom por viñeta (sólo desktop)
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

    // ── Zoom de viñeta en desktop ─────────────────────────────────────────
    // Sólo se construye con puntero fino y hover disponible: en táctil no se
    // inyecta ningún nodo y el pinch nativo del navegador queda intacto.
    _buildComicZoom() {
        this._zoomEntries = [];

        // Debe coincidir con la media query de .comic-zoom-ctrl en layout.css.
        if (!window.matchMedia('(min-width: 1024px) and (any-hover: hover) and (any-pointer: fine)').matches) return;

        this._slides.forEach((slide) => {
            const img = slide.querySelector('.comic-slide-img');
            if (!img) return;

            const wrap = document.createElement('div');
            wrap.className = 'comic-zoom-ctrl';

            const btnOut = document.createElement('button');
            btnOut.type = 'button';
            btnOut.className = 'comic-zoom-ctrl__btn comic-zoom-ctrl__btn--out';
            btnOut.setAttribute('aria-label', 'Alejar viñeta');
            btnOut.textContent = '−';

            const btnIn = document.createElement('button');
            btnIn.type = 'button';
            btnIn.className = 'comic-zoom-ctrl__btn comic-zoom-ctrl__btn--in';
            btnIn.setAttribute('aria-label', 'Acercar viñeta');
            btnIn.textContent = '+';

            wrap.appendChild(btnOut);
            wrap.appendChild(btnIn);
            slide.appendChild(wrap);

            const entry = { slide, img, btnOut, btnIn, level: 0, x: 0, y: 0 };
            this._zoomEntries.push(entry);

            btnOut.addEventListener('click', (e) => {
                e.stopPropagation();
                this._stepComicZoom(entry, -1);
            });

            btnIn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._stepComicZoom(entry, 1);
            });

            this._bindComicPan(entry);
            this._applyComicZoom(entry);
        });
    }

    _stepComicZoom(entry, direction) {
        const next = entry.level + direction;
        if (next < 0 || next >= COMIC_ZOOM_LEVELS.length) return;
        entry.level = next;
        // Al volver al 100% se descarta cualquier desplazamiento previo.
        if (next === 0) {
            entry.x = 0;
            entry.y = 0;
        }
        this._applyComicZoom(entry);
    }

    // Aplica escala + desplazamiento sobre la imagen, acotando el pan para que
    // el marco nunca quede con zonas vacías, y sincroniza el estado de botones.
    _applyComicZoom(entry) {
        const scale = COMIC_ZOOM_LEVELS[entry.level];
        const rect  = entry.slide.getBoundingClientRect();
        const maxX  = Math.max(0, (rect.width  * (scale - 1)) / 2);
        const maxY  = Math.max(0, (rect.height * (scale - 1)) / 2);

        entry.x = Math.min(maxX, Math.max(-maxX, entry.x));
        entry.y = Math.min(maxY, Math.max(-maxY, entry.y));

        entry.img.style.transform = `translate(${entry.x}px, ${entry.y}px) scale(${scale})`;
        entry.img.classList.toggle('is-pannable', scale > 1);

        entry.btnOut.disabled = (entry.level === 0);
        entry.btnIn.disabled  = (entry.level === COMIC_ZOOM_LEVELS.length - 1);
    }

    // Arrastre directo sin inercia; sólo habilitado por encima del 100%.
    _bindComicPan(entry) {
        let panning = false;
        let startX = 0, startY = 0, originX = 0, originY = 0;

        entry.img.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;
            if (COMIC_ZOOM_LEVELS[entry.level] <= 1) return;
            panning = true;
            startX  = e.clientX;
            startY  = e.clientY;
            originX = entry.x;
            originY = entry.y;
            entry.img.classList.add('is-panning');
            entry.img.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        entry.img.addEventListener('pointermove', (e) => {
            if (!panning) return;
            entry.x = originX + (e.clientX - startX);
            entry.y = originY + (e.clientY - startY);
            this._applyComicZoom(entry);
        });

        const endPan = (e) => {
            if (!panning) return;
            panning = false;
            entry.img.classList.remove('is-panning');
            if (entry.img.hasPointerCapture(e.pointerId)) entry.img.releasePointerCapture(e.pointerId);
        };

        entry.img.addEventListener('pointerup', endPan);
        entry.img.addEventListener('pointercancel', endPan);
    }

    // Reset de zoom y pan: se dispara antes de cualquier cambio de viñeta para
    // que la navegación nunca quede bloqueada por el estado de zoom.
    _resetComicZoom() {
        if (!this._zoomEntries) return;
        this._zoomEntries.forEach((entry) => {
            entry.level = 0;
            entry.x = 0;
            entry.y = 0;
            this._applyComicZoom(entry);
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
        const isPageZoomed = () => !!window.visualViewport && window.visualViewport.scale > 1.05;

        this._touchStartX = 0;
        this._touchStartY = 0;
        this._trackMultiTouch = false;
        const SWIPE_THRESHOLD = 50;

        this._nodeTrack.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                this._trackMultiTouch = true;
                return;
            }
            this._trackMultiTouch = false;
            this._touchStartX = e.changedTouches[0].screenX;
            this._touchStartY = e.changedTouches[0].screenY;
        });

        this._lastComicTapTime = 0;
        const DOUBLE_TAP_THRESHOLD = 300;

        this._nodeTrack.addEventListener('touchend', (e) => {
            if (this._nodeComicZoom && !this._nodeComicZoom.classList.contains('is-hidden')) return;

            if (this._trackMultiTouch) {
                if (e.touches.length === 0) this._trackMultiTouch = false;
                return;
            }

            if (isPageZoomed()) return;

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

        this._nodeTrack.addEventListener('touchcancel', () => {
            this._trackMultiTouch = false;
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
        this._mainMultiTouch = false;

        this._nodeMain.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                this._mainMultiTouch = true;
                return;
            }
            this._mainMultiTouch = false;
            this._mainTouchStartX = e.changedTouches[0].screenX;
            this._mainTouchStartY = e.changedTouches[0].screenY;
        });

        this._nodeMain.addEventListener('touchend', (e) => {
            if (this._mainMultiTouch) {
                if (e.touches.length === 0) this._mainMultiTouch = false;
                return;
            }

            if (isPageZoomed()) return;

            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const deltaX = touchEndX - this._mainTouchStartX;
            const deltaY = touchEndY - this._mainTouchStartY;

            if (deltaX > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                e.stopPropagation();
                this._goPrev();
            }
        });

        this._nodeMain.addEventListener('touchcancel', () => {
            this._mainMultiTouch = false;
        });

        // Aviso de rotación en portada: cierre por botón o por salir de portrait+chico.
        if (this._nodeRotateHintBtn && this._nodeRotateHint) {
            this._nodeRotateHintBtn.addEventListener('click', () => {
                this._nodeRotateHint.classList.add('is-hidden');
            });

            const rotateHintQuery = window.matchMedia('(orientation: portrait) and (max-width: 480px)');
            const handleRotateHintQueryChange = (e) => {
                if (!e.matches) this._nodeRotateHint.classList.add('is-hidden');
            };
            if (rotateHintQuery.addEventListener) {
                rotateHintQuery.addEventListener('change', handleRotateHintQueryChange);
            } else if (rotateHintQuery.addListener) {
                rotateHintQuery.addListener(handleRotateHintQueryChange);
            }
        }
    }

    // ── Handler: clic en #btn-start-comic ─────────────────────────────────
    _onStartClick() {
        this._nodeCover.classList.add('is-hidden');
        this._nodeIntro.classList.remove('is-hidden');
        if (this._nodeBtnHome) this._nodeBtnHome.classList.remove('is-hidden');
        if (this._nodeComicControls) this._nodeComicControls.classList.remove('is-hidden');

        if (this._nodeComicFirstHint && !this._comicHintTimer) {
            this._comicHintTimer = setTimeout(() => {
                this._nodeComicFirstHint.classList.add('is-hidden');
            }, 6000);
        }
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
        // Todo cambio de viñeta arranca desde 100% y sin desplazamiento.
        this._resetComicZoom();

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

        if (this._nodeComicFirstHint && slide.classList.contains('comic-slide--first')) {
            this._nodeComicFirstHint.classList.add('is-hidden');
            clearTimeout(this._comicHintTimer);
        }

        const imgNode = slide.tagName === 'IMG' ? slide : slide.querySelector('img');
        if (!imgNode) return;
        this._nodeComicZoomImg.src = imgNode.src;
        this._nodeComicZoomImg.alt = imgNode.alt;
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
        this._resetComicZoom();
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
