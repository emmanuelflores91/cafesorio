// js/modules/MapHandler.js — Controlador del mapa ilustrativo

/**
 * Coordenadas de referencia para la URI de Google Maps.
 * Av. del Libertador 5200, Palermo, Buenos Aires.
 */
const MAPS_URI = 'https://maps.app.goo.gl/bbEqqj2s4zFuCF2G6';

class MapHandler {
    /**
     * @param {string} btnSelector      - Selector CSS del botón CTA (ej. '#btn-open-map')
     * @param {string} mapImgSelector   - Selector CSS del elemento de imagen del mapa (ej. '#map-illustration')
     */
    constructor(btnSelector, mapImgSelector) {
        this._btn = document.querySelector(btnSelector);
        this._mapImg = document.querySelector(mapImgSelector);

        if (!this._btn && !this._mapImg) {
            console.warn(`MapHandler: no se encontró ningún elemento para los selectores "${btnSelector}" ni "${mapImgSelector}".`);
            return;
        }

        this._mapEvents();
    }

    // ── Mapeo de eventos ───────────────────────────────────────────────────
    _mapEvents() {
        // Delegar click en el botón CTA
        if (this._btn) {
            this._btn.addEventListener('click', this._openMaps.bind(this));
        }

        // Delegar click en la imagen del mapa ilustrativo
        if (this._mapImg) {
            this._mapImg.addEventListener('click', this._openMaps.bind(this));

            // Accesibilidad: el elemento es interactivo; permitir activación por teclado
            this._mapImg.setAttribute('role', 'button');
            this._mapImg.setAttribute('tabindex', '0');
            this._mapImg.setAttribute('aria-label', 'Abrir ubicación del salón en Google Maps');
            this._mapImg.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this._openMaps();
                }
            });
        }
    }

    // ── Acción: abrir Google Maps en nueva pestaña ─────────────────────────
    _openMaps() {
        window.open(MAPS_URI, '_blank', 'noopener,noreferrer');
    }
}

export default MapHandler;
