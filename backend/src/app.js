require('express-async-errors'); // permite lanzar errores en funciones async y que lleguen al errorHandler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rutas = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const noEncontrado = require('./middlewares/noEncontrado');

const app = express();

app.disable('x-powered-by');
app.use(helmet()); // cabeceras de seguridad HTTP
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '5mb' })); // 5 MB para permitir fotografías en base64
app.use(mongoSanitize()); // quita operadores $ y . del body/query (inyección NoSQL, OWASP A03)
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/salud', (req, res) => res.json({ ok: true, servicio: 'SIGCA API' }));
app.use('/api', rutas);

app.use(noEncontrado);
app.use(errorHandler);

module.exports = app;
