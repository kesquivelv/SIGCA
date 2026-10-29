const mongoose = require('mongoose');
const AppError = require('./AppError');

/**
 * Toma solo los campos permitidos del body. Evita la "asignación masiva"
 * (que un usuario envíe, por ejemplo, rol: 'ADMINISTRADOR' o estado: 'PAGADO').
 */
function pick(obj = {}, campos = []) {
  const r = {};
  for (const c of campos) if (obj[c] !== undefined) r[c] = obj[c];
  return r;
}

/** Verifica que existan los campos obligatorios; si no, responde 400 con el detalle. */
function requerir(obj = {}, campos = []) {
  const faltan = campos.filter((c) => obj[c] === undefined || obj[c] === null || String(obj[c]).trim() === '');
  if (faltan.length) {
    throw new AppError('Faltan campos obligatorios', 400,
      faltan.map((campo) => ({ campo, mensaje: 'Es obligatorio' })));
  }
}

function validarId(id, nombre = 'id') {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`El ${nombre} no es válido`, 400);
}

/** Escapa texto para usarlo con seguridad dentro de una expresión regular de búsqueda. */
const escaparRegex = (t = '') => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^[0-9+\-\s()]{8,20}$/;

module.exports = { pick, requerir, validarId, escaparRegex, RE_CORREO, RE_TELEFONO };
