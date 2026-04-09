# Implementation Plan

- [x] 1. Escribir test de exploración de condición de bug (ANTES del fix)
  - **Property 1: Bug Condition** - Tarjeta sin imagen válida, sin stock numérico, SKU bloqueante, botón extra en hero, WhatsApp ausente en páginas secundarias
  - **CRITICAL**: Este test DEBE FALLAR en el código sin fix — el fallo confirma que los bugs existen
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Este test codifica el comportamiento esperado — validará el fix cuando pase tras la implementación
  - **GOAL**: Exponer contraejemplos que demuestren la existencia de los bugs
  - **Scoped PBT Approach**: Para bugs deterministas (Bug 4, Bug 5), acotar la propiedad a los casos concretos fallidos para garantizar reproducibilidad
  - Inspeccionar `createProductCard()` en `assets/js/main.js`: verificar que el `<img src>` es vacío/inválido cuando `product.image` es Base64 corto o `'data'`
  - Inspeccionar `.product-meta-small` en tarjetas renderizadas: confirmar que solo dice "En Stock" sin valor numérico (Bug 2)
  - En `admin/dashboard.html`, intentar guardar producto sin SKU: confirmar que el guardado falla o lanza error de validación (Bug 3)
  - Abrir `index.html`, contar hijos de `.hero-btns`: confirmar que hay 2 botones (Bug 4)
  - Abrir `pages/nosotros.html` (o cualquier página en `/pages/`): confirmar que `document.querySelector('.whatsapp-float')` retorna `null` (Bug 5)
  - Revisar `animations.js`: confirmar `ease: "power2.out"` global y ausencia de listeners hover GSAP (Bug 7)
  - Ejecutar en código SIN fix — **RESULTADO ESPERADO**: Todos los asserts fallan (confirma que los bugs existen)
  - Documentar contraejemplos encontrados (ej: `createProductCard({image:'',stock:15})` → img sin src, stock sin número)
  - Marcar tarea completa cuando los tests estén escritos, ejecutados y los fallos documentados
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

- [x] 2. Escribir tests de preservación (ANTES de implementar el fix)
  - **Property 2: Preservation** - Filtros de catálogo, guardado con SKU, navegación hero, WhatsApp en index, reduced-motion
  - **IMPORTANT**: Seguir metodología observation-first
  - Observar: `applyAllFilters()` con filtro de categoría "Maisto" en código sin fix → registrar productos retornados
  - Observar: `saveProduct()` con `sku = 'ELK-001'` en código sin fix → confirmar guardado exitoso en Supabase
  - Observar: `.hero-btns a[href*="productos"]` en `index.html` → confirmar que el botón "EXPLORAR PRODUCTOS" existe y navega correctamente
  - Observar: `.whatsapp-float` en `index.html` → confirmar que existe y tiene `href` con `wa.me/525512345678`
  - Observar: con `prefers-reduced-motion: reduce` activo → confirmar que no se ejecutan animaciones GSAP
  - Escribir tests de propiedad: para todo producto con `stock` aleatorio (0–9999), `applyAllFilters()` retorna el mismo conjunto antes y después del fix
  - Escribir test: para todo `formData` con `sku` no vacío, `saveProduct()` produce el mismo resultado antes y después del fix
  - Ejecutar tests en código SIN fix — **RESULTADO ESPERADO**: Todos los tests PASAN (confirma comportamiento base a preservar)
  - Marcar tarea completa cuando los tests estén escritos, ejecutados y pasando en código sin fix
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix: Bugs 1 & 2 – `createProductCard()` en `assets/js/main.js`

  - [x] 3.1 Corregir validación de imagen en `createProductCard()`
    - Ampliar la guarda de `imageUrl` para cubrir Base64 truncado y valor `'data'`
    - Reemplazar la condición existente por: `if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'data' || (imageUrl.startsWith('data:') && imageUrl.length < 100))`
    - Asignar placeholder: `imageUrl = 'https://via.placeholder.com/400?text=' + encodeURIComponent(product.name)`
    - _Bug_Condition: C1 — createProductCard(X) DOES NOT contain <img src=product.image> cuando image es Base64 corto o 'data'_
    - _Expected_Behavior: Property 1 — card.querySelector('img').src IS valid URL o placeholder correcto_
    - _Preservation: applyAllFilters() y renderizado de tarjetas con imagen válida no deben cambiar_
    - _Requirements: 2.1, 3.1_

  - [x] 3.2 Corregir stock numérico en `.product-meta-small`
    - Localizar el span de `stock-status` dentro del template de `createProductCard()`
    - Reemplazar `'En Stock'` por el literal `` `En Stock: ${product.stock} uds.` ``
    - Mantener `'Agotado'` cuando `(product.stock || 0) <= 0`
    - _Bug_Condition: C1 — .product-meta-small DOES NOT contain numeric stock value_
    - _Expected_Behavior: Property 1 — card.querySelector('.product-meta-small').textContent CONTAINS product.stock.toString()_
    - _Preservation: tarjetas con stock=0 siguen mostrando "Agotado" sin cambios_
    - _Requirements: 2.2, 3.1_

- [x] 4. Fix: Bug 3 – SKU opcional en `admin/dashboard.html` y `admin/js/admin.js`

  - [x] 4.1 Actualizar label del campo `#p-sku` en `admin/dashboard.html`
    - Localizar el `<label>` del input `#p-sku` (línea ~811)
    - Agregar `<span style="font-weight:400; color:#888;">(Opcional)</span>` al final del label
    - _Bug_Condition: C2 — saveProduct(formData) FAILS when formData.sku = ''_
    - _Expected_Behavior: Property 2 — label indica visualmente que el campo es opcional_
    - _Requirements: 2.3_

  - [x] 4.2 Eliminar validación obligatoria de SKU en `admin/js/admin.js`
    - Localizar la función de guardado (`saveProduct` o equivalente) en `admin/js/admin.js`
    - Identificar y eliminar o comentar cualquier validación que bloquee el guardado cuando `sku` está vacío
    - Verificar que el `INSERT`/`UPDATE` a Supabase acepta `sku: null` o `sku: ''`
    - _Bug_Condition: C2 — validación manual en admin.js trata SKU como obligatorio_
    - _Expected_Behavior: Property 2 — result.error IS NULL cuando formData.sku = ''_
    - _Preservation: guardado con SKU completado (ej: 'ELK-001') sigue funcionando igual_
    - _Requirements: 2.3, 3.2_

- [x] 5. Fix: Bug 4 – Eliminar botón "Contactar Ahora" de `index.html`

  - [x] 5.1 Eliminar el segundo botón del bloque `.hero-btns` en `index.html`
    - Localizar y eliminar la línea: `<a href="pages/contacto.html" class="btn btn-outline btn-lg">Contactar Ahora</a>`
    - Verificar que `.hero-btns` queda con exactamente un hijo (el botón "EXPLORAR PRODUCTOS")
    - _Bug_Condition: C3 — index.html '.hero-btns' CONTAINS 'Contactar Ahora'_
    - _Expected_Behavior: Property 3a — index_fixed.querySelector('.hero-btns').children.length = 1_
    - _Preservation: el botón "EXPLORAR PRODUCTOS" y su href a pages/productos.html no deben cambiar_
    - _Requirements: 2.4, 3.3_

- [x] 6. Fix: Bug 5 – Agregar `.whatsapp-float` a las 7 páginas secundarias

  - [x] 6.1 Agregar bloque `.whatsapp-float` en `pages/productos.html`
    - Insertar el bloque HTML del botón flotante de WhatsApp antes del `<footer>`
    - Usar `href="https://wa.me/525512345678?text=Hola,%20quiero%20cotizar%20un%20producto%20de%20Easy%20Logikal"`
    - _Requirements: 2.5_

  - [x] 6.2 Agregar bloque `.whatsapp-float` en `pages/producto.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Requirements: 2.5_

  - [x] 6.3 Agregar bloque `.whatsapp-float` en `pages/portafolio.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Requirements: 2.5_

  - [x] 6.4 Agregar bloque `.whatsapp-float` en `pages/contacto.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Requirements: 2.5_

  - [x] 6.5 Agregar bloque `.whatsapp-float` en `pages/nosotros.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Requirements: 2.5_

  - [x] 6.6 Agregar bloque `.whatsapp-float` en `pages/servicios.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Requirements: 2.5_

  - [x] 6.7 Agregar bloque `.whatsapp-float` en `pages/soporte.html`
    - Insertar el mismo bloque HTML antes del `<footer>`
    - _Bug_Condition: C3 — page IN pages/ AND NOT EXISTS '.whatsapp-float'_
    - _Expected_Behavior: Property 3b — dom.querySelector('.whatsapp-float') IS NOT NULL con href que incluya 'wa.me/525512345678'_
    - _Preservation: el .whatsapp-float de index.html no debe ser modificado_
    - _Requirements: 2.5, 3.4_

- [x] 7. Fix: Bug 6 – Footer mejorado en `assets/css/main.css`

  - [x] 7.1 Agregar borde superior de acento rojo al footer
    - En la regla `.footer`, agregar `border-top: 4px solid var(--primary);`
    - _Requirements: 2.6_

  - [x] 7.2 Mejorar tipografía de títulos de columnas del footer
    - Agregar/actualizar reglas para `.footer-links h4, .footer-contact h4`: `font-size: 0.75rem`, `text-transform: uppercase`, `letter-spacing: 0.15em`, `color: var(--primary)`, `border-bottom: 1px solid rgba(255,255,255,0.1)`
    - _Requirements: 2.6_

  - [x] 7.3 Mejorar links del footer con hover animado
    - Agregar reglas para `.footer-links a`: `font-size: 0.9rem`, `color: rgba(255,255,255,0.6)`, `display: block`, `padding: 0.3rem 0`
    - Agregar hover: `color: var(--primary)`, `padding-left: 0.5rem`
    - _Requirements: 2.6_

  - [x] 7.4 Actualizar grid del footer con gap adecuado
    - Actualizar `.footer-grid`: `grid-template-columns: 2fr 1fr 1fr 1.5fr`, `gap: 3rem`, `padding-bottom: 4rem`
    - _Bug_Condition: C4 — footer carece de border-top rojo, jerarquía tipográfica y gap adecuado_
    - _Expected_Behavior: Property 4 — footer con identidad de marca reforzada (rojo #C62828, tipografía jerarquizada)_
    - _Preservation: estructura HTML del footer y columnas de contenido no deben cambiar_
    - _Requirements: 2.6, 3.5_

- [x] 8. Fix: Bug 7 – Animaciones GSAP profesionales en `assets/js/animations.js`

  - [x] 8.1 Actualizar easings globales y de hero
    - Cambiar `gsap.defaults({ ease: "power2.out" })` → `gsap.defaults({ ease: "expo.out" })`
    - Actualizar animaciones de entrada del hero para usar `ease: "expo.out"`
    - _Requirements: 2.7_

  - [x] 8.2 Implementar stagger coordinado en grids de tarjetas
    - Actualizar `ScrollTrigger.batch` para `[data-reveal]` con `stagger: { amount: 0.4, from: "start" }` y `ease: "power3.out"`
    - _Requirements: 2.7_

  - [x] 8.3 Agregar micro-interacciones hover con GSAP en tarjetas
    - Implementar función `initCardHoverEffects()` que registre listeners `mouseenter`/`mouseleave` en `.product-card` y `.category-card`
    - `mouseenter`: `gsap.to(card, { y: -8, duration: 0.3, ease: 'power3.out' })` + `gsap.to(img, { scale: 1.08, duration: 0.4, ease: 'power2.out' })`
    - `mouseleave`: `gsap.to(card, { y: 0, duration: 0.4, ease: 'expo.out' })` + `gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' })`
    - Llamar `initCardHoverEffects()` dentro del bloque que verifica `prefers-reduced-motion`
    - _Bug_Condition: C4 — animations.js USES ease='power2.out' AND NOT HAS stagger coordination AND NOT HAS hover micro-interactions_
    - _Expected_Behavior: Property 4 — usa expo.out/power3.out, stagger coordinado, listeners hover en .product-card y .category-card_
    - _Preservation: el early return de prefers-reduced-motion debe mantenerse; lógica de header scroll no debe cambiar_
    - _Requirements: 2.7, 3.7_

- [x] 9. Verificar que el test de condición de bug ahora pasa
  - **Property 1: Expected Behavior** - Tarjeta completa, SKU opcional, hero limpio, WhatsApp en todas las páginas, animaciones profesionales
  - **IMPORTANT**: Re-ejecutar los MISMOS tests del paso 1 — NO escribir tests nuevos
  - El test del paso 1 codifica el comportamiento esperado; cuando pase, confirma que el fix es correcto
  - Verificar: `createProductCard({image:'',stock:15})` → img con placeholder válido, texto "En Stock: 15 uds."
  - Verificar: `saveProduct({sku:''})` → sin error de validación
  - Verificar: `index.html .hero-btns` → exactamente 1 botón
  - Verificar: cada página en `/pages/` → `.whatsapp-float` presente con href correcto
  - Verificar: `animations.js` → `expo.out` en defaults, stagger coordinado, listeners hover registrados
  - **RESULTADO ESPERADO**: Todos los asserts PASAN (confirma que los bugs están corregidos)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 10. Verificar que los tests de preservación siguen pasando
  - **Property 2: Preservation** - Sin regresiones en filtros, guardado con SKU, navegación, WhatsApp en index, reduced-motion
  - **IMPORTANT**: Re-ejecutar los MISMOS tests del paso 2 — NO escribir tests nuevos
  - Verificar: filtros de catálogo (categoría, precio, disponibilidad) producen el mismo resultado que antes del fix
  - Verificar: `saveProduct({sku:'ELK-001'})` → guardado exitoso sin cambios en el flujo
  - Verificar: botón "EXPLORAR PRODUCTOS" en `index.html` navega a `pages/productos.html`
  - Verificar: `.whatsapp-float` en `index.html` no fue modificado
  - Verificar: con `prefers-reduced-motion: reduce` → no se ejecutan animaciones GSAP
  - Verificar: header fijo, carrito y navegación funcionan en todas las páginas
  - **RESULTADO ESPERADO**: Todos los tests PASAN (confirma que no hay regresiones)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 11. Checkpoint – Todos los tests pasan
  - Confirmar que todos los tests del paso 9 (bug condition) pasan
  - Confirmar que todos los tests del paso 10 (preservation) pasan
  - Revisar visualmente en navegador: catálogo con imágenes y stock numérico, hero con un solo botón, WhatsApp flotante en todas las páginas, footer con identidad de marca, animaciones con easing refinado y hover en tarjetas
  - Si algún test falla, consultar al usuario antes de continuar
