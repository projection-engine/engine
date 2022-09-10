

export function createVBO(type, data, renderingType = gpu.STATIC_DRAW) {
    if (!data && data.buffer instanceof ArrayBuffer && data.byteLength !== undefined || data.length === 0)
        return null

    const buffer = gpu.createBuffer()
    gpu.bindBuffer(type, buffer)
    gpu.bufferData(type, data, renderingType)

    return buffer
}


export function createTexture( width, height, internalFormat, border, format, type, data, minFilter, magFilter, wrapS, wrapT, yFlip, autoUnbind = true) {
    let texture = gpu.createTexture()

    gpu.bindTexture(gpu.TEXTURE_2D, texture)
    gpu.texImage2D(gpu.TEXTURE_2D, 0, internalFormat, width, height, border, format, type, data)
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, magFilter)
    gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, minFilter)

    if (wrapS !== undefined)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, wrapS)
    if (wrapT !== undefined)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, wrapT)
    if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, false)
    if (autoUnbind)
        gpu.bindTexture(gpu.TEXTURE_2D, null)

    return texture
}


 