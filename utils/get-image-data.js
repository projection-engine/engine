export default async function getImageData(base64) {
    const fetchData = await fetch(base64)
    const blob = await fetchData.blob()
    const imageToLoad = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(imageToLoad.width, imageToLoad.height), ctx = canvas.getContext("2d")
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(imageToLoad, 0, 0, imageToLoad.width, imageToLoad.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return {imageData, imageToLoad, canvas, ctx}
}