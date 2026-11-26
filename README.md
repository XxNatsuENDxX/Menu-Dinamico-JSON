# PokéAtlas

PokéAtlas es una Pokédex web en español con menú dinámico y datos obtenidos en tiempo real de [PokéAPI](https://pokeapi.co/). La colección inicial incluye los primeros 151 Pokémon. Se puede explorar por rangos, filtrar por tipo, buscar por nombre o número, guardar favoritos y abrir una ficha con nombre en español, descripción, tipos, medidas y estadísticas.

## Ejecutar localmente

El navegador necesita un servidor local para ejecutar `fetch()`. Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Abre <http://localhost:8000>. También puedes usar la extensión Live Server de Visual Studio Code.

## Publicar en Vercel

Sube el proyecto a un repositorio público de GitHub e impórtalo en Vercel. Selecciona **Other** como framework y deja vacíos el comando de compilación y el directorio de salida. Es una página estática: no requiere `vercel.json`, servidor propio ni clave de API. El navegador consulta PokéAPI directamente; por eso la aplicación necesita conexión a internet.

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
