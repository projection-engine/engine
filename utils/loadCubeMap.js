export default function loadCubeMap(images, gpu, yFlip = true) {
    if (images.length < 6) return null

    let texture = gpu.createTexture()
    gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, texture)

    images.forEach((src, index) => {
        const image = new Image()
        image.src = src
        image.onload = () => {
            gpu.texImage2D(
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + index,
                0,
                gpu.SRGB8_ALPHA8,
                gpu.RGBA,
                gpu.UNSIGNED_BYTE, image)
        }
    })

    gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MAG_FILTER, gpu.LINEAR)
    gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_MIN_FILTER, gpu.LINEAR)
    gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE)
    gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE)
    gpu.texParameteri(gpu.TEXTURE_CUBE_MAP, gpu.TEXTURE_WRAP_R, gpu.CLAMP_TO_EDGE)

    gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, null)
    if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, false);

    return texture
}