# Menú dinámico

Ejercicio de menú dinámico desarrollado con HTML, CSS y JavaScript. Las opciones se cargan desde `menu.json` y pueden administrarse desde la interfaz sin modificar el código fuente.

## Ejecutar localmente

El navegador necesita un servidor local para ejecutar `fetch()`. Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Abre <http://localhost:8000>. También puedes usar la extensión Live Server de Visual Studio Code.

## Publicar

El proyecto puede desplegarse como una página estática en GitHub Pages, Vercel o Netlify. No necesita claves, servidor propio ni consumo de API.

## Estructura

- `index.html`: estructura y regiones accesibles de la página.
- `styles.css`: identidad visual adaptable a escritorio y móvil.
- `app.js`: carga el JSON, genera el menú y administra las opciones.
- `menu.json`: estructura editable con opciones de ejemplo ocultas inicialmente del navbar.

## Funcionalidades

- Generación dinámica del menú desde JSON.
- Submenús configurables.
- Agregar, editar y eliminar opciones desde el navegador.
- Identificadores únicos generados automáticamente.
- Validación de nombre y enlaces.
- Persistencia local con `localStorage`.
- Los cambios guardados localmente se cargan antes que `menu.json`; usa **Restaurar JSON** para volver a las opciones originales.
- Menú móvil responsive y accesible.
- Control para decidir si cada opción aparece en el navbar.
- Restauración de las opciones originales desde `menu.json`.

## Formato JSON

Cada opción puede incluir `id`, `nombre`, `enlace`, `icono`, `mostrarEnMenu` y una lista `hijos`. `mostrarEnMenu: false` mantiene la opción en el administrador, pero la oculta del navbar; si se omite, la opción se muestra. Las opciones sin submenús pueden conservar `hijos: []`.

## Uso de Inteligencia Artificial

Se utilizó Inteligencia Artificial como apoyo para estructurar la aplicación y revisar su interfaz. El código y la información deben ser revisados y comprendidos antes de la entrega.
