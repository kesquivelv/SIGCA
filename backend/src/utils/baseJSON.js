/**
 * Plugin de Mongoose para dar formato a las respuestas JSON:
 *  - quita __v y los campos indicados en "ocultar" (por ejemplo el hash de contraseña),
 *  - por cada campo xxxCentavos agrega xxx en quetzales (precioCentavos 25000 -> precio 250).
 */
module.exports = function baseJSON(schema, { ocultar = [] } = {}) {
  const transform = (doc, ret) => {
    delete ret.__v;
    for (const campo of ocultar) delete ret[campo];
    for (const k of Object.keys(ret)) {
      if (k.endsWith('Centavos') && typeof ret[k] === 'number') ret[k.slice(0, -8)] = ret[k] / 100;
    }
    return ret;
  };
  schema.set('toJSON', { virtuals: true, transform });
  schema.set('toObject', { virtuals: true, transform });
};
