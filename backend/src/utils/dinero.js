/**
 * RN-28: todos los montos se guardan como CENTAVOS ENTEROS.
 * Q250.50 se guarda como 25050. Así se evitan errores de punto flotante
 * (por ejemplo 0.1 + 0.2 = 0.30000000000000004).
 */
const AppError = require('./AppError');

/** Convierte un monto en quetzales (número o texto) a centavos enteros. */
function aCentavos(valor, campo = 'monto') {
  if (valor === null || valor === undefined || valor === '') {
    throw new AppError(`El campo ${campo} es obligatorio`, 400);
  }
  const n = Number(valor);
  if (!Number.isFinite(n)) throw new AppError(`El campo ${campo} debe ser numérico`, 400);
  const centavos = Math.round(n * 100);
  if (Math.abs(n * 100 - centavos) > 1e-6) {
    throw new AppError(`El campo ${campo} admite como máximo 2 decimales`, 400);
  }
  return centavos;
}

/** Convierte centavos a quetzales (número con 2 decimales). */
const aQuetzales = (centavos) => Math.round(centavos) / 100;

/** Texto con formato de moneda guatemalteca: Q1,250.00 */
function formatoQ(centavos) {
  const signo = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos) / 100;
  return `${signo}Q${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { aCentavos, aQuetzales, formatoQ };
