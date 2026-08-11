# Elementos Visuales de la Página Web

> **Guía de lectura rápida:**
> Cada ítem de este documento sigue la siguiente estructura de referencia:
> **[Nombre Semántico]** (Código: `[identificador exacto del elemento para buscar en el código]`): [Descripción breve de su función].

## Pantalla de Inicio (Cover)
1. **Texto Introductorio** (Código: `.cover-sequence__eyebrow`): Texto pequeño superior
2. **Línea Separadora** (Código: `.cover-sequence__divider`): Línea decorativa horizontal
3. **Título Principal** (Código: `.cover-sequence__title`): Título de bienvenida
4. **Letra Capitular** (Código: `.cover-sequence__dropcap`): Primera letra destacada
5. **Subtítulo** (Código: `.cover-sequence__subtitle`): Texto explicativo secundario
6. **Botón Inicio** (Código: `#btn-start-comic`): Botón arrancar recorrido
7. **Icono Botón** (Código: `.cover-sequence__cta-icon`): Icono grano café
35. **Estado Portada** (Código: `#app-state-cover`): Contenedor vista inicial
46. **Contenedor Interior** (Código: `.cover-sequence__inner`): Agrupador contenido portada
52. **Hint Rotación Teléfono** (Código: `.cover-sequence__phone-hint`): Contenedor sugerencia rotación
53. **Icono Teléfono** (Código: `.cover-sequence__phone-icon`): Icono girar pantalla

## Secuencia de Historieta (Intro)
8. **Contenedor Historieta** (Código: `.comic-track`): Caja de viñetas
9. **Viñetas Cómicas** (Código: `.comic-slide`): Imágenes de historia
36. **Estado Historieta** (Código: `#app-state-intro`): Contenedor vista comic
47. **Imagen Viñeta** (Código: `.comic-slide-img`): Foto de historieta
48. **Leyenda Viñeta** (Código: `.comic-slide__caption`): Texto descriptivo imagen
49. **Zoom Historieta** (Código: `.comic-zoom`): Contenedor ampliación viñeta

## Panel de Galería (Principal Izquierdo)
10. **Contenedor Imágenes** (Código: `.gallery-grid__track`): Grilla de fotos
11. **Fotos Predio** (Código: `.gallery-grid__slide`): Imágenes del lugar
12. **Caja Zoom** (Código: `.gallery-grid__zoom`): Contenedor imagen ampliada
13. **Imagen Ampliada** (Código: `.gallery-grid__zoom-img`): Foto en detalle
14. **Botón Cerrar Zoom** (Código: `.gallery-grid__zoom-close`): Botón ocultar zoom
15. **Icono Cerrar** (Código: `.gallery-grid__zoom-close-icon`): Icono cruz cierre
37. **Estado Principal** (Código: `#app-state-main`): Contenedor vista principal
38. **Layout Dividido** (Código: `.layout-split`): Contenedor pantalla dividida
39. **Sección Galería** (Código: `.layout-split__gallery`): Contenedor izquierdo layout
40. **Grilla Galería** (Código: `.gallery-grid`): Componente grilla fotos
50. **Controles Grilla** (Código: `.gallery-grid__controls`): Agrupador controles galería _(eliminado)_
51. **Botón Volver Historieta** (Código: `#btn-back-to-last-comic`): Botón retornar a historieta _(eliminado)_

## Panel de Información (Principal Derecho)
16. **Logotipo Predio** (Código: `.venue-info__logo`): Logo del salón
17. **Texto Dirección** (Código: `.venue-info__address`): Ubicación del lugar
18. **Enlace Ubicación** (Código: `.venue-link`): Link a mapas
19. **Icono Ubicación** (Código: `.venue-icon-mask.venue-link__icon`): Icono pin mapa
20. **Enlace Instagram** (Código: `.venue-link`): Link red social
21. **Icono Instagram** (Código: `.venue-icon-mask.venue-link__icon`): Icono cámara Instagram
22. **Enlace Video** (Código: `.venue-link`): Link recorrido visual
23. **Icono Video** (Código: `.venue-icon-mask.venue-link__icon`): Icono reproducción video
24. **Divisor Vertical** (Código: `.venue-info__divider`): Línea separadora acciones
25. **Botón Formulario** (Código: `.venue-form-btn`): Link asistencia dieta
26. **Icono Formulario** (Código: `.venue-icon-mask.venue-form-btn__icon`): Icono documento web
33. **Navegación Enlaces** (Código: `.venue-info__links`): Contenedor de links
41. **Sección Información** (Código: `.layout-split__info`): Contenedor derecho layout
42. **Contenedor Logo** (Código: `.venue-info__logo-wrapper`): Envoltorio imagen logo
43. **Cuerpo Información** (Código: `.venue-info__body`): Contenedor textos información
44. **Contenedor Acciones** (Código: `.venue-info__actions`): Agrupador enlaces botones
45. **Sección Formulario** (Código: `.venue-info__form-section`): Envoltorio botón formulario

## Controles de Navegación (Global)
27. **Barra Controles** (Código: `.comic-controls`): Contenedor botones navegación
28. **Botón Anterior** (Código: `.comic-btn--prev`): Retroceder una viñeta
29. **Botón Inicio** (Código: `#btn-go-home`): Volver a portada
30. **Icono Inicio** (Código: `.venue-icon-mask.btn-inicio__icon`): Icono casa inicio
31. **Indicadores Progreso** (Código: `.comic-dots`): Puntos de avance
32. **Botón Siguiente** (Código: `.comic-btn--next`): Avanzar una viñeta
34. **Icono Navegación** (Código: `.comic-btn-icon`): Icono flecha dirección
54. **Indicador Individual** (Código: `.comic-dot`): Punto navegación viñeta
