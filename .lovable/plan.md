

## Qué significa "Optimizar imágenes: convertir PNGs a WebP y agregar srcset responsive"

### En resumen

Es una técnica para que las imágenes del sitio **pesen menos** y **carguen más rápido**, especialmente en celulares o conexiones lentas.

### Dos partes:

**1. Convertir PNGs a WebP**
- WebP es un formato de imagen moderno (creado por Google) que produce archivos **30-50% más chicos** que PNG con la misma calidad visual.
- Ejemplo: si `logo-red-akasha-header.png` pesa 120 KB, en WebP pesaría ~60-70 KB.
- Resultado: la página carga más rápido porque descarga menos datos.

**2. Agregar `srcset` responsive**
- Hoy el sitio envía la misma imagen grande a todos los dispositivos (celular, tablet, desktop).
- Con `srcset`, el navegador elige automáticamente la imagen del tamaño correcto: una chica para celulares, una mediana para tablets, una grande para desktop.
- Resultado: un celular no descarga una imagen de 1280px cuando solo necesita 320px.

### Impacto práctico

- **Velocidad**: páginas cargan 1-3 segundos más rápido en móviles.
- **Datos**: usuarios gastan menos datos móviles.
- **SEO**: Google premia sitios con imágenes optimizadas (mejor ranking).
- **Core Web Vitals**: mejora LCP (Largest Contentful Paint), que es una métrica clave de rendimiento.

### Ya tienen algo implementado

El proyecto ya tiene un componente `ResponsiveImage` y `LazyImage` preparados para esto — solo falta generar las versiones WebP y en diferentes tamaños de los assets estáticos (logos, backgrounds).

