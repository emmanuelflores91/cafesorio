### `TECH_SPEC.md`

# Technical Specification

## 1. Estructura del Sistema de Archivos
```text
/
├── index.html
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── typography.css
│   ├── layout.css        # Define el Grid Split-Screen
│   └── components/
│       ├── gallery.css
│       └── info-panel.css
├── js/
│   ├── main.js           # Entry point (type="module")
│   └── modules/
│       ├── GalleryController.js
│       └── MapHandler.js
└── assets/
    ├── images/           # WebP/AVIF optimizados
    ├── vectors/          # Patrón de fondo e íconos SVG
    └── fonts/