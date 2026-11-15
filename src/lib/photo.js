export async function compressImage(file, maxW = 800, quality = 0.7) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
  })
}