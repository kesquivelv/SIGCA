/** Lee una imagen del equipo y la reduce (máx. 480 px, JPEG) para guardarla como texto en la base de datos. */
export function archivoAImagen(archivo, maxLado = 480, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    if (!archivo.type.startsWith('image/')) return reject(new Error('El archivo debe ser una imagen (JPG, PNG o WebP)'));
    if (archivo.size > 8 * 1024 * 1024) return reject(new Error('La imagen es demasiado pesada (máximo 8 MB)'));
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen está dañada o no es compatible'));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', calidad));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
