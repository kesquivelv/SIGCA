# SIGCA — Sistema Integral de Gestión de Citas y Atención

Aplicación web Full Stack para un centro de atención psicológica y estimulación auditiva verbal. Integra un **portal público** (información institucional, servicios, contenido educativo, horarios, contacto y solicitud de citas) con un **sistema administrativo privado** (pacientes, responsables, profesionales, servicios, citas, calendario, materiales, pagos, saldos y caja diaria).

Proyecto Final Integrador — Desarrollo Web — Universidad Mariano Gálvez de Guatemala.

## Integrantes

| Integrante | Carné | Responsabilidad principal |
|---|---|---|
| Kevin Esquivel | _(5190-18-3661)_ | _(Backend y base de datos)_ |
| _(nombre)_ | _(carné)_ | _(completar)_ |
| _(nombre)_ | _(carné)_ | _(completar)_ |

## Tecnologías

**Backend:** Node.js 18+, Express 4, MongoDB + Mongoose 8, JSON Web Tokens, bcryptjs, Helmet, express-rate-limit, express-mongo-sanitize, dotenv.

**Frontend:** Vue 3, Vue Router, Pinia, Axios, FullCalendar, Vite.

## Estructura del repositorio

```
sigca/
├── backend/
│   ├── src/
│   │   ├── config/         Conexión a MongoDB
│   │   ├── models/         Modelos Mongoose (13 colecciones + publicaciones y contadores)
│   │   ├── controllers/    Lógica de cada módulo
│   │   ├── routes/         Endpoints y permisos por rol
│   │   ├── middlewares/    Autenticación JWT, roles y manejo central de errores
│   │   ├── services/       Reglas de negocio de citas y cálculos financieros
│   │   ├── utils/          Dinero en centavos, fechas, validaciones
│   │   ├── app.js          Configuración de Express y seguridad
│   │   └── server.js       Punto de entrada
│   ├── seed/seed.js        Datos de prueba
│   ├── tests/              Prueba automática del procedimiento de evaluación
│   └── .env.example
├── frontend/               Aplicación Vue 3
├── postman/                Colección de Postman
└── docs/                   Guía de defensa y evidencias
```

## Requisitos de instalación

1. **Node.js 18 o superior** (`node -v`).
2. **MongoDB 6 o superior**, de una de estas dos formas:
   - **Local:** instalar MongoDB Community Server (en Windows queda como servicio y escucha en `mongodb://127.0.0.1:27017`). Se recomienda instalar también MongoDB Compass para revisar los datos.
   - **MongoDB Atlas (nube):** crear un clúster gratuito, un usuario de base de datos, permitir su IP en *Network Access* y copiar la cadena de conexión `mongodb+srv://...`.
3. Git.

## Configuración de MongoDB y variables de entorno

En `backend/` copie el archivo de ejemplo y edítelo:

```bash
cd backend
cp .env.example .env        # en Windows (PowerShell): copy .env.example .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `MONGODB_URI` | Conexión a MongoDB (local o Atlas) | `mongodb://127.0.0.1:27017/sigca` |
| `JWT_SECRET` | Clave para firmar tokens (larga y aleatoria) | `una-cadena-larga-y-secreta` |
| `JWT_EXPIRES_IN` | Duración de la sesión | `8h` |
| `CORS_ORIGIN` | URL del frontend | `http://localhost:5173` |
| `TZ_OFFSET` | Zona horaria del centro | `-06:00` |

> El archivo `.env` está en `.gitignore`: **nunca** se sube a GitHub.

## Comandos de ejecución

**Backend**

```bash
cd backend
npm install
npm run seed        # carga datos de prueba (BORRA los datos existentes)
npm run dev         # inicia la API en http://localhost:4000/api
```

**Frontend** (en otra terminal)

```bash
cd frontend
npm install
npm run dev         # abre http://localhost:5173
```

**Prueba automática del procedimiento de evaluación** (con la API corriendo y recién cargado el seed):

```bash
cd backend
npm run test:flujo
```

Recorre los pasos de la sección 16 del enunciado (login, paciente, responsable, servicio, cita, traslape, caja, abonos, saldo, cierre, permisos, etc.) y valida 71 resultados esperados.

## Datos de prueba

`npm run seed` crea: 1 administrador, 2 recepcionistas, 3 profesionales y 1 usuario inactivo; 10 pacientes (6 menores, 1 inactivo); 5 responsables; 5 servicios; 15 citas en todos los estados; 11 pagos (completos, parciales y 2 anulados); 3 cajas (2 cerradas — una con faltante de Q10.00 — y 1 abierta); 5 materiales con asignaciones; 5 solicitudes (pendientes, atendida y rechazada); contenido institucional, publicaciones, horarios y mensajes de contacto. Todos los datos son ficticios.

## Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@sigca.com | Admin123! |
| Recepcionista (con caja abierta) | recepcion1@sigca.com | Recep123! |
| Recepcionista | recepcion2@sigca.com | Recep123! |
| Profesional — Psicología | psicologa@sigca.com | Prof123! |
| Profesional — Lenguaje | terapeuta@sigca.com | Prof123! |
| Profesional — Auditiva | auditiva@sigca.com | Prof123! |
| Usuario inactivo (no puede ingresar) | inactivo@sigca.com | Inactivo123! |

## Colección de Postman

Importe `postman/SIGCA.postman_collection.json`. Ejecute primero **1. Autenticación → Login admin**: el token y los IDs creados se guardan solos en variables de la colección, así que las carpetas pueden correrse en orden (o completas con *Run collection*).

## Seguridad implementada

Contraseñas con bcrypt; autenticación JWT; usuarios inactivos bloqueados aunque tengan token vigente; permisos por rol verificados en cada endpoint del backend; hashes nunca expuestos (`select: false`); lista blanca de campos en cada formulario (evita asignación masiva); saneamiento contra inyección NoSQL; cabeceras Helmet; límite de intentos en login y formularios públicos; manejo centralizado de errores con códigos HTTP adecuados; secretos en variables de entorno.

## Distribución de responsabilidades

| Integrante | Módulos |
|---|---|
| Integrante 1 — Backend y base de datos | Modelos, API REST, pacientes, responsables, servicios |
| Integrante 2 — Frontend e integración | Vue, Router, Pinia, portal público, formularios, calendario |
| Integrante 3 — Seguridad y finanzas | Autenticación, roles, citas, pagos, caja diaria, validaciones |

_(Ajustar según la distribución real del grupo.)_
