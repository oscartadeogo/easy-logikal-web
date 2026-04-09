# Catálogo UI Mejoras – Bugfix Design

## Overview

Este documento cubre el diseño técnico para corregir 7 bugs y mejoras de UI/UX en el proyecto **Easy Logikal Comercialización**. Los cambios afectan `assets/js/main.js` (tarjetas de producto), `admin/dashboard.html` (campo SKU), `index.html` (hero), todas las páginas secundarias en `/pages/` (WhatsApp flotante y footer), y `assets/js/animations.js` (sistema GSAP).

La estrategia de fix es quirúrgica: cambios mínimos y localizados que no rompan el comportamiento existente de filtros, carrito, Supabase ni navegación.

---

## Glossary

- **Bug_Condition (C)**: La condición que activa el defecto — inputs o contextos donde el comportamiento actual difiere del esperado
- **Property (P)**: El comportamiento correcto que debe producirse cuando C(X) es verdadero
- **Preservation**: Comportamiento existente que NO debe cambiar tras el fix
- **createProductCard(product, context)**: Función en `assets/js/main.js` (línea ~170) que genera el HTML de cada tarjeta de producto para catálogo y destacados
- **product.image**: Campo de la tabla `products` en Supabase que contiene la URL de la imagen principal del producto
- **product.stock**: Campo numérico en Supabase que representa las unidades disponibles
- **`.product-meta-small`**: Contenedor dentro de `.product-info` en la tarjeta que muestra SKU y estado de stock
- **`.whatsapp-float`**: Elemento `<a>` flotante fijo en esquina inferior derecha con enlace a WhatsApp
- **`#p-sku`**: Input de texto en `admin/dashboard.html` para el código SKU del producto
- **`.hero-btns`**: Contenedor de botones CTA en la sección hero de `index.html`
- **`animations.js`**: Archivo en `assets/js/` que inicializa todas las animaciones GSAP del sitio

---

## Bug Details

### Bug Condition

Los 7 bugs se agrupan en 4 condiciones distintas:

**C1 – Template de tarjeta incompleto** (Bugs 1 y 2): La función `createProductCard()` en `assets/js/main.js` genera HTML de tarjeta que no incluye el tag `<img>` con `product.image` de forma visible cuando el contexto es `'catalog'` con búsqueda activa, y no muestra el valor numérico de `product.stock`.

**C2 – Campo SKU con `required` implícito** (Bug 3): El input `#p-sku` en `admin/dashboard.html` (línea 811) no tiene atributo `required` explícito en el HTML, pero la validación del formulario o el flujo de guardado en `admin/js/admin.js` trata el campo como obligatorio, bloqueando el guardado sin SKU.

**C3 – Elementos HTML ausentes en páginas** (Bugs 4 y 5): `index.html` contiene el botón `"Contactar Ahora"` en `.hero-btns` que debe eliminarse. Las páginas en `/pages/` no contienen el bloque `.whatsapp-float` que sí existe en `index.html`.

**C4 – Animaciones GSAP básicas** (Bugs 6 y 7): El footer carece de estilos de identidad de marca y `assets/js/animations.js` usa easings genéricos (`power2.out`) sin stagger coordinado ni micro-interacciones hover.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X = { type: 'card' | 'sku' | 'html' | 'animation', context: any }
  OUTPUT: boolean

  IF X.type = 'card' THEN
    RETURN createProductCard(X.product) DOES NOT contain <img src=product.image>
           OR .product-meta-small DOES NOT contain numeric stock value
  END IF

  IF X.type = 'sku' THEN
    RETURN saveProduct(X.formData) FAILS when X.formData.sku = ''
  END IF

  IF X.type = 'html' THEN
    RETURN (X.page = 'index.html' AND '.hero-btns' CONTAINS 'Contactar Ahora')
           OR (X.page IN pages/ AND NOT EXISTS '.whatsapp-float')
  END IF

  IF X.type = 'animation' THEN
    RETURN animations.js USES ease='power2.out'
           AND NOT HAS stagger coordination
           AND NOT HAS hover micro-interactions
  END IF
END FUNCTION
```

### Examples

- **Bug 1**: Usuario escribe "Maisto" en `#product-search` → tarjetas se renderizan sin imagen (img tag presente pero `src` vacío o placeholder incorrecto)
- **Bug 2**: Producto con `stock: 15` → tarjeta muestra "En Stock" pero no "En Stock: 15 uds."
- **Bug 3**: Admin crea producto sin SKU → formulario no guarda o muestra error de validación
- **Bug 4**: Usuario visita `index.html` → ve dos botones en hero: "EXPLORAR PRODUCTOS" y "CONTACTAR AHORA"
- **Bug 5**: Usuario navega a `pages/nosotros.html` → no hay botón flotante de WhatsApp en la esquina
- **Bug 6**: Footer en cualquier página → diseño plano sin jerarquía visual ni identidad de marca reforzada
- **Bug 7**: Scroll en catálogo → tarjetas aparecen con fade simple, sin stagger ni easing refinado

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Los filtros de categoría, precio y disponibilidad en `pages/productos.html` deben continuar funcionando exactamente igual
- El flujo de guardado de productos con SKU completado en el admin no debe cambiar
- El botón "EXPLORAR PRODUCTOS" del hero debe continuar navegando a `pages/productos.html`
- El clic en `.whatsapp-float` debe continuar abriendo WhatsApp con el número y mensaje preconfigurado en nueva pestaña
- El header fijo con navegación, logo y carrito debe permanecer sin cambios en todas las páginas
- La página de detalle `pages/producto.html` (galería, precio, variantes, botones) no debe verse afectada
- Cuando `prefers-reduced-motion: reduce` está activo, las animaciones GSAP deben seguir siendo omitidas

**Scope:**
Todos los inputs que NO correspondan a las condiciones C1–C4 deben producir exactamente el mismo resultado antes y después del fix.

---

## Hypothesized Root Cause

### Bug 1 – Imagen en búsqueda avanzada

El template en `createProductCard()` (línea ~170 de `main.js`) ya incluye el tag `<img>` con `src="${imageUrl}"`. La causa probable es que la variable `imageUrl` se construye correctamente pero el elemento `<div class="product-image">` tiene `display: none` o `visibility: hidden` en algún estado CSS cuando el contexto es búsqueda, o bien el `aspect-ratio: 1/1` con `object-fit: contain` colapsa la imagen si el contenedor no tiene altura definida en el contexto de catálogo filtrado. Revisando el CSS, `.product-image` tiene `aspect-ratio: 1/1` que debería funcionar, pero puede haber un conflicto con el `contain: content` en `.product-grid`.

**Causa más probable**: El `style="display: block;"` inline en el `<div class="product-image">` ya está presente en el template actual. El problema real puede ser que `imageUrl` recibe `'data'` como valor (hay una guarda `imageUrl === 'data'` en el código) cuando `product.image` es un Base64 truncado, generando una URL inválida que el placeholder no cubre correctamente.

### Bug 2 – Stock numérico

En `.product-meta-small`, el template actual genera:
```html
<span class="stock-status ...">
  ${(product.stock || 0) > 0 ? 'En Stock' : 'Agotado'}
</span>
```
El valor numérico de `product.stock` nunca se interpola en el texto visible.

### Bug 3 – SKU requerido en admin

El input `#p-sku` en `admin/dashboard.html` (línea 811) no tiene `required` en el HTML. La causa probable está en la función `setupProductEventListeners()` o en la función de guardado en `admin/js/admin.js` que valida campos antes del `INSERT` a Supabase, posiblemente con una validación manual que incluye SKU como campo obligatorio.

### Bug 4 – Botón "Contactar Ahora"

El botón existe explícitamente en `index.html` dentro de `.hero-btns`:
```html
<a href="pages/contacto.html" class="btn btn-outline btn-lg">Contactar Ahora</a>
```
Requiere eliminación directa del elemento.

### Bug 5 – WhatsApp ausente en páginas secundarias

El bloque `.whatsapp-float` solo existe en `index.html` (antes del `<footer>`). Las 7 páginas en `/pages/` no lo tienen. Requiere adición del bloque HTML en cada página.

### Bug 6 – Footer básico

El footer actual en `main.css` tiene estilos funcionales pero carece de: separador visual entre la zona de contenido y el `footer-bottom`, tipografía con peso diferenciado en títulos de columna, y un borde o acento de color `#C62828` que refuerce la identidad de marca.

### Bug 7 – Animaciones básicas

`animations.js` usa `gsap.defaults({ ease: "power2.out" })` globalmente. Las tarjetas de producto no tienen micro-interacciones hover con GSAP (solo CSS transitions). No hay stagger coordinado entre secciones. El `ScrollTrigger.batch` para `[data-reveal]` usa `stagger: 0.1` pero sin `ease` refinado por elemento.

---

## Correctness Properties

Property 1: Bug Condition – Tarjeta de producto completa con imagen y stock numérico

_For any_ producto donde `isBugCondition_card(X)` es verdadero (tarjeta renderizada en catálogo o búsqueda), la función `createProductCard()` corregida SHALL producir un elemento HTML que contenga un `<img>` con `src` válido apuntando a `product.image` (o al placeholder), Y un texto en `.product-meta-small` que incluya el valor numérico de `product.stock` en formato "En Stock: N uds." o "Agotado".

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition – SKU opcional en admin

_For any_ formulario de producto donde `sku = ''` (campo vacío), la función de guardado corregida en `admin/js/admin.js` SHALL completar el `INSERT`/`UPDATE` a Supabase sin error de validación, guardando `sku: null` o `sku: ''` según corresponda.

**Validates: Requirements 2.3**

Property 3: Bug Condition – Elementos HTML correctos en todas las páginas

_For any_ página del sitio donde `isBugCondition_html(X)` es verdadero, el DOM corregido SHALL: (a) en `index.html`, contener exactamente un botón en `.hero-btns` ("EXPLORAR PRODUCTOS"); (b) en cualquier página de `/pages/`, contener exactamente un elemento `.whatsapp-float` con `href` que incluya `wa.me/525512345678`.

**Validates: Requirements 2.4, 2.5**

Property 4: Bug Condition – Animaciones GSAP profesionales

_For any_ ejecución de `animations.js` donde `prefers-reduced-motion` es `false`, el sistema corregido SHALL usar `ease: "expo.out"` o `"power3.out"` en animaciones de entrada, aplicar `stagger` coordinado entre elementos de la misma sección, y registrar listeners GSAP hover en `.product-card` y `.category-card`.

**Validates: Requirements 2.6, 2.7**

Property 5: Preservation – Filtros y renderizado sin regresión

_For any_ interacción de filtro (categoría, precio, stock, búsqueda) donde `isBugCondition(X)` es `false`, la función `applyAllFilters()` corregida SHALL producir exactamente el mismo conjunto de productos renderizados que la versión original, preservando el orden, conteo y propiedades de cada tarjeta.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

---

## Fix Implementation

### Bug 1 & 2 – `assets/js/main.js` → `createProductCard()`

**Archivo**: `assets/js/main.js`

**Función**: `createProductCard(product, context)`

**Cambios específicos**:

1. **Validación de imagen mejorada**: Ampliar la guarda de `imageUrl` para cubrir el caso `imageUrl.startsWith('data')` con longitud corta (Base64 truncado):
   ```javascript
   if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'data' || 
       (imageUrl.startsWith('data:') && imageUrl.length < 100)) {
     imageUrl = 'https://via.placeholder.com/400?text=' + encodeURIComponent(product.name);
   }
   ```

2. **Stock numérico en `.product-meta-small`**: Reemplazar el span de stock-status para incluir el número:
   ```javascript
   // ANTES:
   ${(product.stock || 0) > 0 ? 'En Stock' : 'Agotado'}
   
   // DESPUÉS:
   ${(product.stock || 0) > 0 
     ? `En Stock: ${product.stock} uds.` 
     : 'Agotado'}
   ```

### Bug 3 – `admin/dashboard.html` → campo `#p-sku`

**Archivo**: `admin/dashboard.html`

**Línea**: ~811

**Cambios específicos**:

1. Actualizar el `<label>` para indicar opcionalidad:
   ```html
   <!-- ANTES -->
   <label>SKU (Código Interno)</label>
   
   <!-- DESPUÉS -->
   <label>SKU (Código Interno) <span style="font-weight:400; color:#888;">(Opcional)</span></label>
   ```

2. Verificar y eliminar cualquier validación manual de SKU en `admin/js/admin.js` en la función de guardado (`saveProduct` o equivalente).

### Bug 4 – `index.html` → hero

**Archivo**: `index.html`

**Cambio**: Eliminar el segundo botón del bloque `.hero-btns`:
```html
<!-- ELIMINAR esta línea: -->
<a href="pages/contacto.html" class="btn btn-outline btn-lg">Contactar Ahora</a>
```

### Bug 5 – Páginas secundarias → `.whatsapp-float`

**Archivos**: `pages/productos.html`, `pages/producto.html`, `pages/portafolio.html`, `pages/contacto.html`, `pages/nosotros.html`, `pages/servicios.html`, `pages/soporte.html`

**Cambio**: Agregar antes del `<footer>` en cada página:
```html
<!-- Floating WhatsApp Button -->
<a href="https://wa.me/525512345678?text=Hola,%20quiero%20cotizar%20un%20producto%20de%20Easy%20Logikal" 
   class="whatsapp-float" target="_blank" aria-label="Contactar por WhatsApp">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
</a>
```

### Bug 6 – Footer mejorado (`assets/css/main.css`)

**Archivo**: `assets/css/main.css`

**Cambios en la sección `.footer`**:

1. Agregar borde superior de acento rojo al footer:
   ```css
   .footer {
     border-top: 4px solid var(--primary); /* #C62828 */
   }
   ```

2. Mejorar títulos de columnas del footer:
   ```css
   .footer-links h4,
   .footer-contact h4 {
     font-size: 0.75rem;
     text-transform: uppercase;
     letter-spacing: 0.15em;
     color: var(--primary);
     margin-bottom: 1.5rem;
     padding-bottom: 0.5rem;
     border-bottom: 1px solid rgba(255,255,255,0.1);
   }
   ```

3. Mejorar links del footer:
   ```css
   .footer-links a {
     font-size: 0.9rem;
     color: rgba(255,255,255,0.6);
     transition: var(--transition-fast);
     display: block;
     padding: 0.3rem 0;
   }
   .footer-links a:hover {
     color: var(--primary);
     padding-left: 0.5rem;
   }
   ```

4. Reforzar el `footer-grid` con gap adecuado:
   ```css
   .footer-grid {
     display: grid;
     grid-template-columns: 2fr 1fr 1fr 1.5fr;
     gap: 3rem;
     padding-bottom: 4rem;
   }
   ```

### Bug 7 – Animaciones GSAP (`assets/js/animations.js`)

**Archivo**: `assets/js/animations.js`

**Reescritura completa** con los siguientes cambios clave:

1. **Easings refinados**: Cambiar `power2.out` → `expo.out` en hero, `power3.out` en scroll reveals
2. **Stagger coordinado**: Usar `stagger: { amount: 0.4, from: "start" }` en grids de tarjetas
3. **Micro-interacciones hover**: Agregar listeners GSAP en `.product-card` y `.category-card`
4. **Respeto a `prefers-reduced-motion`**: Mantener el early return existente
5. **Header scroll**: Mantener la lógica CSS-class existente (ya es óptima)

```javascript
// Micro-interacciones hover (nuevo)
function initCardHoverEffects() {
  const cards = document.querySelectorAll('.product-card, .category-card');
  cards.forEach(card => {
    const img = card.querySelector('img');
    
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -8, duration: 0.3, ease: 'power3.out' });
      if (img) gsap.to(img, { scale: 1.08, duration: 0.4, ease: 'power2.out' });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.4, ease: 'expo.out' });
      if (img) gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' });
    });
  });
}
```

---

## Testing Strategy

### Validation Approach

La estrategia sigue dos fases: primero confirmar el bug en código sin fix (exploratory), luego verificar el fix y que no hay regresiones (fix checking + preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Confirmar cada bug antes de implementar el fix. Refutar o confirmar las hipótesis de root cause.

**Test Plan**: Inspección manual del DOM y revisión de código fuente para cada condición.

**Test Cases**:

1. **Bug 1 – Imagen**: Abrir `pages/productos.html`, escribir cualquier término en `#product-search`, inspeccionar el `src` de los `<img>` en las tarjetas resultantes → confirmar que `src` es vacío, inválido o placeholder incorrecto (fallará en código sin fix)
2. **Bug 2 – Stock**: Inspeccionar el HTML de `.product-meta-small` en cualquier tarjeta → confirmar que solo dice "En Stock" sin número (fallará en código sin fix)
3. **Bug 3 – SKU**: En `admin/dashboard.html`, intentar guardar un producto sin SKU → confirmar que el guardado falla o muestra error (fallará en código sin fix)
4. **Bug 4 – Hero**: Abrir `index.html`, contar botones en `.hero-btns` → confirmar que hay 2 botones (fallará en código sin fix)
5. **Bug 5 – WhatsApp**: Abrir `pages/nosotros.html`, buscar `.whatsapp-float` en el DOM → confirmar que no existe (fallará en código sin fix)
6. **Bug 6 – Footer**: Inspeccionar CSS del footer → confirmar ausencia de `border-top` rojo y estilos de jerarquía en títulos de columna
7. **Bug 7 – Animaciones**: Revisar `animations.js` → confirmar `ease: "power2.out"` global y ausencia de listeners hover GSAP

**Expected Counterexamples**:
- Tarjetas sin imagen visible o con placeholder incorrecto
- Stock mostrado como texto sin número
- Formulario admin bloqueado sin SKU
- Dos botones en hero
- Ausencia de `.whatsapp-float` en páginas secundarias

### Fix Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug se cumple, el código corregido produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL product IN catalog WHERE isBugCondition_card(product) DO
  card := createProductCard_fixed(product)
  ASSERT card.querySelector('img').src IS valid URL
  ASSERT card.querySelector('.product-meta-small').textContent CONTAINS product.stock.toString()
END FOR

FOR ALL page IN pages/ WHERE isBugCondition_html(page) DO
  dom := loadPage_fixed(page)
  ASSERT dom.querySelector('.whatsapp-float') IS NOT NULL
  ASSERT dom.querySelector('.whatsapp-float').href CONTAINS 'wa.me/525512345678'
END FOR

ASSERT index_fixed.querySelector('.hero-btns').children.length = 1
ASSERT index_fixed.querySelector('.hero-btns a').textContent CONTAINS 'Explorar'

FOR ALL formData WHERE formData.sku = '' DO
  result := saveProduct_fixed(formData)
  ASSERT result.error IS NULL
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug NO se cumple, el comportamiento es idéntico al original.

**Pseudocode:**
```
FOR ALL filterInput WHERE NOT isBugCondition(filterInput) DO
  ASSERT applyAllFilters_original(filterInput) = applyAllFilters_fixed(filterInput)
END FOR

FOR ALL product WHERE product.sku IS NOT NULL AND product.sku != '' DO
  ASSERT saveProduct_original(product) = saveProduct_fixed(product)
END FOR

FOR ALL page WHERE page HAS '.whatsapp-float' ALREADY DO
  ASSERT dom_original(page).querySelector('.whatsapp-float') 
       = dom_fixed(page).querySelector('.whatsapp-float')
END FOR
```

**Testing Approach**: Las verificaciones de preservation se hacen mediante inspección manual y pruebas de regresión en los flujos críticos: filtrado de catálogo, guardado de producto con SKU, navegación desde hero, y clic en WhatsApp.

**Test Cases**:
1. **Filtros de catálogo**: Aplicar filtro de categoría "Maisto" → verificar que los productos correctos se muestran con imagen y stock numérico
2. **Guardado con SKU**: Crear producto con SKU "ELK-001" → verificar que se guarda correctamente en Supabase
3. **Navegación hero**: Clic en "EXPLORAR PRODUCTOS" → verificar redirección a `pages/productos.html`
4. **WhatsApp en index**: Verificar que el `.whatsapp-float` de `index.html` no fue modificado
5. **Animaciones con reduced-motion**: Activar `prefers-reduced-motion: reduce` → verificar que no hay animaciones

### Unit Tests

- Verificar que `createProductCard()` con `product.image = ''` genera placeholder correcto
- Verificar que `createProductCard()` con `product.stock = 0` muestra "Agotado"
- Verificar que `createProductCard()` con `product.stock = 25` muestra "En Stock: 25 uds."
- Verificar que el DOM de cada página en `/pages/` contiene exactamente un `.whatsapp-float`
- Verificar que `index.html` contiene exactamente un botón en `.hero-btns`

### Property-Based Tests

- Generar productos con `stock` aleatorio (0–9999) → verificar que el número siempre aparece en la tarjeta
- Generar productos con `image` en distintos formatos (URL válida, vacío, Base64 corto, `'data'`) → verificar que siempre se muestra una imagen válida o el placeholder
- Generar formularios de producto con `sku` vacío o nulo → verificar que el guardado siempre tiene éxito

### Integration Tests

- Flujo completo: cargar catálogo → buscar → verificar tarjetas con imagen y stock numérico
- Flujo admin: login → crear producto sin SKU → verificar en Supabase que el registro existe
- Flujo navegación: visitar cada página en `/pages/` → verificar presencia de `.whatsapp-float` y footer mejorado
- Flujo animaciones: scroll en página con tarjetas → verificar que las animaciones usan easing refinado y stagger
