# SIGCA — Frontend

Vue 3 + Vite + Vue Router + Pinia + Axios + FullCalendar. Consume únicamente los endpoints reales del backend (`/api`).

## Iniciar

Requisitos: Node.js 18+ y el backend corriendo (ver README de la raíz).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

En desarrollo, Vite reenvía `/api` a `http://localhost:4000` (proxy), así que no hace falta configurar CORS ni variables.

## Conexión con el backend

| Variable (`frontend/.env`) | Para qué sirve | Por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API que usa Axios | `/api` |
| `VITE_PROXY_TARGET` | Destino del proxy de `npm run dev` | `http://localhost:4000` |

Copie `.env.example` a `.env` solo si necesita cambiarlas. Para producción: `npm run build` genera `dist/`; defina `VITE_API_URL` con la URL completa de la API (por ejemplo `https://api.midominio.com/api`) y en el backend ajuste `CORS_ORIGIN` a la URL del frontend.

## Rutas

- Portal público: `/`, `/nosotros`, `/servicios`, `/educativo`, `/institucional`, `/contacto`, `/solicitar-cita`.
- Panel: `/admin/login` y `/admin/*` (inicio, calendario, citas, solicitudes, pacientes, responsables, profesionales, servicios, materiales, pagos, caja, usuarios, contenido, mensajes).

## Roles

La sesión usa JWT (guardado en `localStorage`, enviado como `Bearer`). El menú y las rutas se filtran por rol, pero **el backend siempre valida los permisos**.

| Módulo | Administrador | Recepcionista | Profesional |
|---|---|---|---|
| Citas, calendario, pacientes | Todo | Todo | Solo las suyas, consulta y completar |
| Solicitudes, responsables, pagos, caja, mensajes | Sí | Sí | No |
| Servicios, usuarios, contenido del portal | Sí | No | No |
| Materiales | Administra y asigna | Consulta | Consulta y asigna |

## Estructura

```
src/
├── api/          Axios y funciones por módulo (único lugar con URLs)
├── stores/       Pinia: auth, toast, publico, panel
├── router/       Rutas y guardas por rol
├── layouts/      PublicLayout, AdminLayout
├── views/        public/ y admin/
├── components/   ui/ (modal, tabla, campos…), art/ (ilustraciones SVG), admin/ (formularios)
├── styles/       tokens.css, base.css, ui.css, portal.css, admin.css
└── utils/        formato (Q, fechas), validadores, imágenes
```

## Notas

- Dinero siempre en quetzales (`Q1,250.00`); el backend lo guarda en centavos.
- Las imágenes de publicaciones y avatares se ingresan por URL o se suben redimensionadas (se guardan como data URL); no hay servicio de almacenamiento de archivos.
- El calendario usa la zona horaria del navegador.

## Pendiente (tercer integrante)

Autenticación, roles, gestión de citas, pagos, caja diaria y validaciones están asignados al tercer integrante y figuran como **pendientes**. Las pantallas y llamadas actuales son una implementación de referencia para que el panel funcione; deben ser revisadas y completadas por esa persona.
