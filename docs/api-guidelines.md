# API Endpoint Guidelines

Este documento resume el estándar adoptado para diseñar y documentar los endpoints de StarShop.

## Convenciones generales

- **Formato REST:** Se utilizan rutas basadas en recursos. Cada recurso se maneja con los métodos HTTP correspondientes:
  - `GET /recurso` para listar
  - `POST /recurso` para crear
  - `GET /recurso/{id}` para obtener un elemento
  - `PUT` o `PATCH /recurso/{id}` para actualizar
  - `DELETE /recurso/{id}` para eliminar
- **Prefijo de versión:** Todos los endpoints se sirven bajo `/api/v1`.
- **Nomenclatura de paths:** Se emplea *kebab-case* y nombres en plural para los recursos. Evitar prefijos como `show`, `update` o `delete` en la ruta.
- **Manejo de errores:** Los controladores deben usar las clases definidas en `src/utils/errors` para enviar respuestas coherentes.
- **Documentación:** Actualizar `openapi.yaml` al crear o modificar endpoints siguiendo esta estructura.

Seguir estas reglas permite una API consistente y fácil de consumir.
