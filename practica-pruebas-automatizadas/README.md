# PokéAtlas

Esta práctica parte del primer commit del repositorio (`4c752f7`). Incluye la aplicación PokéAtlas y pruebas automatizadas de interfaz y API con Playwright. La Pokédex permite explorar los primeros 151 Pokémon, navegar por rangos, filtrar por tipo, buscar por nombre o número, guardar favoritos y abrir fichas.

## Preparar el entorno

Se requiere Node.js 20 o superior, npm, Python y conexión a internet para las pruebas de API.

```bash
npm ci
npx playwright install chromium
```

## Ejecutar las pruebas

```bash
npm test
```

El comando inicia un servidor local para la aplicación y ejecuta las pruebas en Chromium. También se pueden ejecutar por separado:

```bash
npm run test:ui
npm run test:api
npm run report
```

Las pruebas de interfaz interceptan PokéAPI con respuestas controladas para evitar depender de la disponibilidad de la API. Las pruebas API consultan PokéAPI directamente; comprueban un Pokémon existente (`200` y JSON) y un recurso inexistente (`404` y JSON).

## Casos cubiertos

Interfaz:

1. Carga de la colección, tarjetas y paginación.
2. Navegación desde el menú a un rango de Pokémon.
3. Búsqueda, ficha de detalle y favoritos.
4. Filtro mediante el submenú de tipos.

API:

1. Respuesta `200` y estructura JSON de Pikachu.
2. Respuesta `404` y cuerpo JSON para un Pokémon inexistente.

Playwright genera el reporte HTML en `playwright-report/`. Las capturas de la colección inicial y la navegación por rango se guardan en `evidencias/`.

## Ejecutar la aplicación sin pruebas

Desde esta carpeta:

```bash
python -m http.server 8000
```

Abre <http://localhost:8000>. La aplicación necesita conexión a internet para consultar PokéAPI.

## Publicar

El proyecto puede desplegarse como una página estática en GitHub Pages, Vercel o Netlify. Las pruebas requieren Node.js y se ejecutan localmente con npm.

El navegador consulta PokéAPI directamente; no se requieren claves ni un servidor API propio.

## Estructura

- `index.html`: estructura y regiones accesibles de la página.
- `styles.css`: identidad visual adaptable a escritorio y móvil.
- `app.js`: consulta PokéAPI, genera la navegación, filtra la colección y crea las fichas.

## Uso de PokéAPI y menú dinámico

La aplicación hace solicitudes `GET` a la API REST pública:

- `/pokemon?limit=151`: construye la colección del menú y las tarjetas.
- `/type`: genera dinámicamente las opciones del submenú de tipos.
- `/type/{tipo}`: obtiene los Pokémon de un tipo elegido.
- `/pokemon/{id}` y `/pokemon-species/{id}`: cargan los detalles y textos en español al abrir una ficha.

PokéAPI entrega respuestas JSON. Los rangos del submenú se generan a partir de la lista recibida; los tipos se generan con la respuesta del endpoint `/type`. Los favoritos se guardan localmente en el navegador.

## Conceptos de intercambio de datos

- **API (interfaz de programación de aplicaciones):** reglas y puntos de acceso que permiten a programas solicitar datos o servicios de otros programas.
- **REST:** estilo para diseñar API sobre HTTP, con recursos identificados por URL y métodos como `GET`. PokéAPI ofrece una API REST.
- **SOAP:** protocolo formal de intercambio de mensajes estructurados, normalmente en XML.
- **JSON:** formato de texto basado en objetos y listas, frecuente en API web. PokéAPI lo utiliza para enviar sus respuestas.
- **XML:** formato de datos estructurados con etiquetas; también se utiliza en servicios SOAP.
- **GraphQL:** lenguaje de consulta de API que permite solicitar campos específicos; el servidor suele responder con JSON.

API describe cómo se comunican los sistemas; REST, SOAP y GraphQL son enfoques/protocolos para ofrecer o consultar datos. JSON y XML son formatos para representar e intercambiar esos datos.

## Uso de Inteligencia Artificial

Se utilizó Inteligencia Artificial como apoyo para estructurar la aplicación, implementar la integración con PokéAPI y revisar su interfaz. El código y la información deben ser revisados y comprendidos antes de la entrega.
