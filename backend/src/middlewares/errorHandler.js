/**
 * Manejo centralizado de errores: todos los errores terminan aquí y se
 * traducen a un código HTTP adecuado con un mensaje claro en español (RN-30).
 */
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';
  let { detalles } = err;

  if (err.name === 'ValidationError') {
    status = 400;
    mensaje = 'Los datos enviados no son válidos';
    detalles = Object.values(err.errors).map((e) => ({
      campo: e.path,
      mensaje: e.kind === 'required' || e.kind === 'user defined' || e.kind === 'regexp' || e.kind === 'min' || e.kind === 'max' || e.kind === 'enum' || e.kind === 'minlength' || e.kind === 'maxlength'
        ? e.message : `Valor inválido para ${e.path}`,
    }));
  } else if (err.name === 'CastError') {
    status = 400;
    mensaje = `Valor inválido para el campo ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const campos = Object.keys(err.keyValue || err.keyPattern || {}).join(', ');
    mensaje = `Ya existe un registro con ese valor${campos ? ` (${campos})` : ''}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    mensaje = 'La información enviada es demasiado grande (máx. 5 MB). Use imágenes más livianas.';
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') mensaje = 'Error interno del servidor';
  }

  res.status(status).json({ mensaje, ...(detalles ? { detalles } : {}) });
};
