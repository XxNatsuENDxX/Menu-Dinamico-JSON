# Evidencia de ejecución

- Fecha: 26 de noviembre de 2026.
- Comando: `npm test`.
- Resultado: 6 pruebas aprobadas, 0 fallidas.
- Interfaz: 4 pruebas con datos de PokéAPI simulados para mantener resultados deterministas.
- API: 2 pruebas contra PokéAPI pública; respuesta `200` y error `404`, ambos con validación JSON.

Capturas:

- `01-coleccion-inicial.png`: colección, tarjetas y paginación.
- `02-navegacion-rango.png`: navegación al rango 051–100 desde el menú.

El reporte HTML detallado se genera localmente en `playwright-report/` al ejecutar las pruebas.
