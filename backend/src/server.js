require('dotenv').config();
const app = require("./app");
const conectarDB = require("./config/db");

const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    "Configure JWT_SECRET en backend/.env (copie backend/.env.example) con al menos 32 caracteres",
  );
  process.exit(1);
}

conectarDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`SIGCA API escuchando en http://localhost:${PORT}/api`),
    ),
  )
  .catch((err) => {
    console.error("No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  });
