# Análisis UI/UX de Captura Móvil

## 1. Dimensiones de Pantalla de Referencia

-   **Resolución de la captura:** **585 × 949 px**
-   **Viewport de referencia utilizado para el análisis:** **360 × 800
    px (Android estándar)**

> Todas las coordenadas se expresan aproximadamente sobre un viewport de
> **360×800 px**, escalando proporcionalmente la captura.

## 2. Tabla de Elementos, Posición y Tamaño

  --------------------------------------------------------------------------------------------
              ID Nombre Semántico          Tipo de       Posición    Coordenadas   Tamaño
                                           Elemento      Espacial    Estimadas     Estimado
  -------------- ------------------------- ------------- ----------- ------------- -----------
               1 `page-background`         Fondo         Pantalla    top:0 left:0  360×800
                                           decorativo    completa                  

               2 `gallery-grid`            Contenedor    Superior    top:25        324×210
                                                                     left:18       

               3 `gallery-image-01`        Imagen        Superior    top:30        145×95
                                                         Izquierda   left:20       

               4 `gallery-image-02`        Imagen        Superior    top:30        145×95
                                                         Derecha     left:195      

               5 `gallery-image-03`        Imagen        Inferior    top:132       145×95
                                                         Izquierda   left:20       
                                                         del grid                  

               6 `gallery-image-04`        Imagen        Inferior    top:132       145×95
                                                         Derecha del left:195      
                                                         grid                      

               7 `gallery-pagination`      Indicador     Centro      top:245       70×16
                                                                     left:145      

               8 `btn-gallery-prev`        Botón/Icono   Centro      top:244       18×18
                                                         Izquierda   left:92       

               9 `btn-home`                Botón/Icono   Centro      top:244       18×18
                                                                     left:136      

              10 `brand-logo`              Logotipo      Centro      top:292       80×42
                                                                     left:140      

              11 `venue-address`           Texto         Centro      top:342       230×42
                                                                     left:65       

              12 `quick-links-section`     Contenedor    Inferior    top:420       320×175
                                                                     left:20       

              13 `btn-directions`          Botón         Inferior    top:438       130×32
                                                         Izquierda   left:20       

              14 `icon-location`           Icono         Inferior    top:438       18×18
                                                         Izquierda   left:20       

              15 `label-directions`        Texto         Inferior    top:438       82×18
                                                         Izquierda   left:48       

              16 `btn-instagram`           Botón         Inferior    top:486       130×32
                                                         Izquierda   left:20       

              17 `icon-instagram`          Icono         Inferior    top:486       20×20
                                                         Izquierda   left:20       

              18 `label-instagram`         Texto         Inferior    top:486       90×18
                                                         Izquierda   left:48       

              19 `btn-tour`                Botón         Inferior    top:535       135×32
                                                         Izquierda   left:20       

              20 `icon-video`              Icono         Inferior    top:535       20×18
                                                         Izquierda   left:20       

              21 `label-tour`              Texto         Inferior    top:535       95×18
                                                         Izquierda   left:48       

              22 `vertical-divider`        Separador     Centro      top:430       1×135
                                                         Inferior    left:180      

              23 `btn-attendance-form`     Botón         Inferior    top:445       120×80
                                                         Derecha     left:210      

              24 `label-attendance-form`   Texto         Inferior    top:438       120×42
                                                         Derecha     left:208      

              25 `icon-document`           Icono         Inferior    top:505       28×28
                                                         Derecha     left:272      
  --------------------------------------------------------------------------------------------

## 3. Distribución y Jerarquía del Layout

### Background

-   Fondo beige claro.
-   Patrón repetitivo de baja opacidad ocupando todo el viewport.

### Galería Principal

-   Grid 2×2 centrado.
-   Imágenes del mismo tamaño, borde blanco y sombra.
-   Ocupa aproximadamente el 90% del ancho.

### Navegación de Galería

    ←    Home    ● ○ ○ ●

### Identidad del Lugar

    Logo
    Dirección
    Provincia

### Acciones

Distribución en dos columnas.

**Izquierda** - Cómo llegar - Ver en Instagram - Recorrer el predio

**Derecha** - Formulario de asistencia y consideraciones alimentarias -
Icono de documento

### Estructura General

    Background

    ↓
    Galería (2x2)

    ↓
    Controles

    ↓
    Logo

    ↓
    Dirección

    ↓
    Acciones (2 columnas)

Características: - Contenido centrado. - Márgenes laterales
constantes. - Grid de dos columnas únicamente en la sección inferior. -
Separación vertical amplia. - Jerarquía visual: Galería → Logo →
Dirección → Acciones.
