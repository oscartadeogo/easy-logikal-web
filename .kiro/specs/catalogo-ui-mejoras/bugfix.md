# Bugfix Requirements Document

## Introduction

Este documento cubre 7 bugs y mejoras de UI/UX reportados para el proyecto **Easy Logikal Comercialización** (MPA con HTML5, CSS3, JavaScript Vanilla, GSAP 3.12.2, Supabase). Los problemas afectan el catálogo de productos, el panel de administración, la sección hero, el botón flotante de WhatsApp, el footer y el sistema de animaciones.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 – Catálogo: Búsqueda avanzada sin imagen**

1.1 WHEN el usuario escribe en el campo de búsqueda avanzada (`#product-search`) y los resultados se renderizan mediante `createProductCard()` THEN el sistema muestra las tarjetas de producto sin imagen (la imagen no se renderiza o aparece rota en los resultados filtrados)

**Bug 2 – Catálogo: Stock no visible en tarjetas**

1.2 WHEN el usuario visualiza las tarjetas de producto en el catálogo (`pages/productos.html`) THEN el sistema muestra únicamente el texto "En Stock" o "Agotado" pero no muestra la cantidad numérica de unidades disponibles

**Bug 3 – Admin: Campo SKU requerido**

1.3 WHEN el administrador intenta guardar un producto nuevo en `admin/dashboard.html` sin completar el campo SKU (`#p-sku`) THEN el sistema impide el guardado o trata el campo como obligatorio, bloqueando la creación de productos sin SKU

**Bug 4 – Hero: Botón "Contactar Ahora" presente**

1.4 WHEN el usuario visita la página de inicio (`index.html`) y observa la sección hero THEN el sistema muestra dos botones: "EXPLORAR PRODUCTOS" y "CONTACTAR AHORA", cuando el segundo no debería existir

**Bug 5 – WhatsApp flotante solo en inicio**

1.5 WHEN el usuario navega a cualquier página secundaria (`pages/productos.html`, `pages/producto.html`, `pages/contacto.html`, `pages/nosotros.html`, `pages/servicios.html`, `pages/portafolio.html`, `pages/soporte.html`) THEN el sistema no muestra el botón flotante de WhatsApp (`.whatsapp-float`), que solo existe en `index.html`

**Bug 6 – Footer con diseño deficiente**

1.6 WHEN el usuario visualiza el footer en cualquier página del sitio THEN el sistema muestra un footer con diseño básico que carece de jerarquía visual, separación adecuada entre columnas, y elementos de confianza que refuercen la identidad de marca

**Bug 7 – Animaciones no profesionales**

1.7 WHEN el usuario navega por el sitio y las animaciones GSAP se ejecutan THEN el sistema presenta animaciones que se perciben como básicas, sin curvas de easing refinadas, sin micro-interacciones en hover de tarjetas, y sin transiciones de entrada coordinadas entre secciones

---

### Expected Behavior (Correct)

**Bug 1 – Catálogo: Búsqueda avanzada con imagen**

2.1 WHEN el usuario busca en el campo de búsqueda avanzada y los resultados se renderizan THEN el sistema SHALL mostrar la imagen del producto (`product.image`) correctamente en cada tarjeta de resultado, usando el placeholder de `via.placeholder.com` cuando la imagen no esté disponible

**Bug 2 – Catálogo: Stock numérico visible**

2.2 WHEN el usuario visualiza las tarjetas de producto en el catálogo THEN el sistema SHALL mostrar la cantidad numérica de unidades disponibles junto al indicador de stock (ej: "En Stock: 15 uds." o "Agotado") en el elemento `.product-meta-small` de cada tarjeta

**Bug 3 – Admin: Campo SKU opcional**

2.3 WHEN el administrador crea o edita un producto en el panel de administración THEN el sistema SHALL permitir guardar el producto sin completar el campo SKU, marcando visualmente el campo como "(Opcional)" en su etiqueta

**Bug 4 – Hero: Solo botón "Explorar Productos"**

2.4 WHEN el usuario visita la página de inicio y observa la sección hero THEN el sistema SHALL mostrar únicamente el botón "EXPLORAR PRODUCTOS", sin el botón "CONTACTAR AHORA"

**Bug 5 – WhatsApp flotante en todas las páginas**

2.5 WHEN el usuario navega a cualquier página del sitio (inicio y todas las páginas secundarias) THEN el sistema SHALL mostrar el botón flotante de WhatsApp (`.whatsapp-float`) con el enlace `https://wa.me/525512345678?text=...` en todas las páginas

**Bug 6 – Footer mejorado**

2.6 WHEN el usuario visualiza el footer en cualquier página THEN el sistema SHALL mostrar un footer con diseño mejorado que incluya: separación visual clara entre columnas, tipografía con jerarquía adecuada, colores consistentes con la identidad de marca (rojo `#C62828`, negro `#0A0A0A`), y una franja inferior con copyright bien delimitada

**Bug 7 – Animaciones profesionales con GSAP**

2.7 WHEN el usuario navega por el sitio y las animaciones GSAP se ejecutan THEN el sistema SHALL presentar animaciones con easing refinado (`expo.out`, `power3.out`), stagger coordinado entre elementos de la misma sección, micro-interacciones fluidas en hover de tarjetas de producto y categorías, y transiciones de entrada escalonadas que respeten `prefers-reduced-motion`

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN el usuario aplica filtros de categoría, precio o disponibilidad en el catálogo THEN el sistema SHALL CONTINUE TO filtrar y renderizar los productos correctamente con todas sus propiedades

3.2 WHEN el administrador guarda un producto con SKU completado THEN el sistema SHALL CONTINUE TO guardar el SKU en Supabase sin cambios en el flujo existente

3.3 WHEN el usuario hace clic en el botón "EXPLORAR PRODUCTOS" del hero THEN el sistema SHALL CONTINUE TO navegar a `pages/productos.html`

3.4 WHEN el usuario hace clic en el botón flotante de WhatsApp THEN el sistema SHALL CONTINUE TO abrir WhatsApp con el número y mensaje preconfigurado en una nueva pestaña

3.5 WHEN el usuario navega entre páginas del sitio THEN el sistema SHALL CONTINUE TO mostrar el header fijo con navegación, logo y carrito correctamente

3.6 WHEN el usuario visita la página de detalle de producto (`pages/producto.html`) THEN el sistema SHALL CONTINUE TO mostrar la galería de imágenes, precio, stock, variantes y botones de acción sin cambios

3.7 WHEN el sistema detecta `prefers-reduced-motion: reduce` THEN el sistema SHALL CONTINUE TO omitir todas las animaciones GSAP como lo hace actualmente

---

## Bug Condition Pseudocode

```pascal
// Bug 1: Imagen en búsqueda avanzada
FUNCTION isBugCondition_1(X)
  INPUT: X = { searchTerm: string, products: Product[] }
  OUTPUT: boolean
  RETURN X.searchTerm.length > 0 AND renderContext = 'catalog'
END FUNCTION

FOR ALL X WHERE isBugCondition_1(X) DO
  cards ← renderProducts'(filter(X.products, X.searchTerm))
  ASSERT EACH card HAS visible img element WITH valid src
END FOR

// Bug 2: Stock numérico
FUNCTION isBugCondition_2(X)
  INPUT: X = Product
  OUTPUT: boolean
  RETURN X.stock IS NOT NULL
END FUNCTION

FOR ALL X WHERE isBugCondition_2(X) DO
  card ← createProductCard'(X)
  ASSERT card CONTAINS text WITH X.stock numeric value
END FOR

// Bug 5: WhatsApp en todas las páginas
FUNCTION isBugCondition_5(X)
  INPUT: X = { page: string }
  OUTPUT: boolean
  RETURN X.page IN ['productos.html', 'producto.html', 'contacto.html',
                    'nosotros.html', 'servicios.html', 'portafolio.html', 'soporte.html']
END FUNCTION

FOR ALL X WHERE isBugCondition_5(X) DO
  dom ← loadPage'(X.page)
  ASSERT dom CONTAINS element WITH class 'whatsapp-float'
END FOR

// Preservation Check
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
