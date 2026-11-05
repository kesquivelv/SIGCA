# Instalación de SIGCA en Windows 11

Guía paso a paso para dejar el sistema funcionando desde cero.

## 1. Requisitos (una sola vez)

1. **Node.js 18 o superior** (versión LTS): https://nodejs.org. Verifique en PowerShell con `node -v`.
2. **MongoDB Community Server**: https://www.mongodb.com/try/download/community. Durante la instalación elija *Complete* y deje marcado *Install MongoD as a Service*.
3. **MongoDB Compass** (opcional, para ver los datos).
4. **VS Code** y **Git**.

Compruebe MongoDB abriendo Compass y conectando a `mongodb://localhost:27017`.

## 2. Ubicar el proyecto

Descomprima el ZIP en una ruta corta, **fuera de OneDrive** y sin espacios ni tildes, por ejemplo `C:\Proyectos\sigca`. Ábrala en VS Code (Archivo → Abrir carpeta) y abra la terminal con Ctrl + ñ.

Si PowerShell muestra que la ejecución de scripts está deshabilitada, ejecute una sola vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 3. Backend (terminal 1)

```powershell
cd C:\Proyectos\sigca\backend
copy .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Abra `backend\.env` y pegue la cadena generada en `JWT_SECRET` (debe tener al menos 32 caracteres). Revise que `MONGODB_URI` diga `mongodb://127.0.0.1:27017/sigca`. Luego:

```powershell
npm install
npm run seed
npm run dev
```

Debe aparecer `SIGCA API escuchando en http://localhost:4000/api`. **Deje esta terminal abierta.**

## 4. Frontend (terminal 2)

Abra otra terminal con el botón **+** de VS Code:

```powershell
cd C:\Proyectos\sigca\frontend
npm install
npm run dev
```

Abra en el navegador **http://localhost:5173**. El sistema administrativo está en **http://localhost:5173/admin**.

## 5. Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@sigca.com | Admin123! |
| Recepcionista (con caja abierta) | recepcion1@sigca.com | Recep123! |
| Recepcionista | recepcion2@sigca.com | Recep123! |
| Profesional | psicologa@sigca.com | Prof123! |
| Profesional | terapeuta@sigca.com | Prof123! |
| Profesional | auditiva@sigca.com | Prof123! |

## 6. Verificación opcional

Con la API corriendo, en una tercera terminal:

```powershell
cd C:\Proyectos\sigca\backend
npm run seed
npm run test:flujo
```

Debe terminar con `Resultado: 53 correctas, 0 con error`. Después vuelva a ejecutar `npm run seed` para dejar los datos limpios.

También puede importar en Postman `postman/SIGCA.postman_collection.json` y ejecutarla completa con *Run collection*.

## 7. Uso diario

Cada vez que vaya a trabajar o a presentar, abra dos terminales:

- Terminal 1: `cd backend` y `npm run dev`
- Terminal 2: `cd frontend` y `npm run dev`

`npm install` solo se repite si cambian las dependencias. `npm run seed` **borra todo** y recarga los datos de prueba: úselo antes de la demostración para empezar limpio.

## 8. Problemas frecuentes

| Mensaje | Solución |
|---|---|
| `No se pudo conectar a MongoDB` / `ECONNREFUSED 127.0.0.1:27017` | Win + R → `services.msc` → iniciar **MongoDB Server** |
| `Configure JWT_SECRET en backend/.env…` o `Falta la variable de entorno MONGODB_URI` | No se creó `backend\.env`, la línea está comentada con `#`, la clave tiene menos de 32 caracteres, o se ejecutó fuera de la carpeta `backend` |
| `EADDRINUSE :4000` o `:5173` | Ya hay otra terminal ejecutando ese servidor; ciérrela |
| El portal carga pero sin datos, o el login falla con "No se pudo conectar con el servidor" | La API (terminal 1) no está corriendo |
| Faltan imágenes o la tipografía se ve distinta | No hay internet: las fotos de ejemplo y la fuente se descargan de la web. El sistema funciona igual |
