// js/main.js — Entry point (ES6 Module)

import IntroController   from './modules/IntroController.js';
import GalleryController from './modules/GalleryController.js';
import MapHandler        from './modules/MapHandler.js';

const init = () => {
    // ── Secuencia de introducción ──────────────────────────────────────────
    new IntroController('#app-state-cover', '#app-state-intro', '#app-state-main', '.comic-track', '#btn-start-comic');

    // ── Galería fotográfica ────────────────────────────────────────────────
    const galleryElement = document.querySelector('.gallery-grid');
    if (galleryElement) {
        new GalleryController(galleryElement);
    }

    // ── Mapa ilustrativo (Suspendido temporalmente por carencia de nodos) ──
    // new MapHandler('#btn-open-map', '#map-illustration');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}