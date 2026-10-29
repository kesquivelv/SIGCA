/**
 * Error controlado de la aplicación. Lleva el código HTTP que se devolverá
 * al cliente y, opcionalmente, detalles (por ejemplo, errores por campo).
 */
class AppError extends Error {
  constructor(mensaje, status = 400, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
module.exports = AppError;
