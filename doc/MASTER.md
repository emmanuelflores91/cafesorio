# MASTER DOC: Boda SPA

## 1. Visión del Proyecto
Aplicación de Página Única (SPA) estática diseñada para complementar la invitación impresa de la boda. Su propósito exclusivo es proveer información logística y visual del salón de eventos bajo una experiencia de usuario premium, minimalista y libre de fricciones.

## 2. Restricciones Arquitectónicas
- **Stack Tecnológico:** HTML5 Semántico, CSS3 Nativo, JavaScript Vanilla (ES6 Modules).
- **Prohibiciones Absolutas:** React, Vue, Angular, Bootstrap, Tailwind, jQuery, bundlers (Vite/Webpack), y cualquier librería de terceros no autorizada explícitamente.
- **Distribución:** Totalmente estática, compatible con GitHub Pages.

## 3. Identidad y Dirección de Arte
- **Estética:** Premium, limpia, con abundante espacio en blanco (`whitespace`). 
- **Protagonista Visual:** Fotografía del salón.
- **Guiño Conceptual:** Inyección de patrón gráfico (motivos de programación, café y perros) renderizado exclusivamente vía pseudo-elementos CSS (`::before`/`::after`) con una opacidad máxima de 0.03, garantizando que no compita con la legibilidad ni la fotografía.

## 4. Estrategia de Layout (Desktop / Mobile)
- **Desktop (Viewport ≥ 1024px):** Patrón Split-Screen.
  - Panel Izquierdo (60vw): Galería fotográfica inmersiva.
  - Panel Derecho (40vw): Contenedor de información, tipografía jerarquizada, mapa ilustrativo. Sin scroll vertical global si es posible.
- **Mobile (Viewport < 1024px):** Flujo de bloque estándar (Stacking). Galería en el tercio superior (Sticky o inline), seguido del panel de información.