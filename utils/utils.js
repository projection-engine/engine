import {vec3} from "gl-matrix"

function isArrayBufferV(value) {
    return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined
}

export function createVAO() {
    const vao = window.gpu.createVertexArray()
    window.gpu.bindVertexArray(vao)
    return vao
}


export function createVBO(type, data, renderingType = window.gpu.STATIC_DRAW) {
    if (data.length === 0)
        return null

    if (!isArrayBufferV(data)) {
        return null
    }
    let buffer = window.gpu.createBuffer()
    window.gpu.bindBuffer(type, buffer)
    window.gpu.bufferData(type, data, renderingType)

    return buffer
}


export function createRBO( width, height, typeStorage =window.gpu.DEPTH24_STENCIL8, type = window.gpu.DEPTH_STENCIL_ATTACHMENT) {
    const gpu = window.gpu
    const rbo = gpu.createRenderbuffer()
    gpu.bindRenderbuffer(gpu.RENDERBUFFER, rbo)
    gpu.renderbufferStorage(gpu.RENDERBUFFER, typeStorage, width, height)
    gpu.framebufferRenderbuffer(gpu.FRAMEBUFFER, type, gpu.RENDERBUFFER, rbo)

    if (gpu.checkFramebufferStatus(gpu.FRAMEBUFFER) !== gpu.FRAMEBUFFER_COMPLETE)
        return null

    return rbo
}


export function createTexture( width, height, internalFormat, border, format, type, data, minFilter, magFilter, wrapS, wrapT, yFlip, autoUnbind = true) {
    const gpu = window.gpu
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

export function bindTexture(index, texture, location, gpu) {

    gpu.activeTexture(gpu.TEXTURE0 + index)
    gpu.bindTexture(gpu.TEXTURE_2D, texture)
    gpu.uniform1i(location, index)
}


export function lookAt(yaw, pitch, position) {
    const cosPitch = Math.cos(pitch)
    const sinPitch = Math.sin(pitch)
    const cosYaw = Math.cos(yaw)
    const sinYaw = Math.sin(yaw)

    let xAxis = [cosYaw, 0, -sinYaw],
        yAxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch],
        zAxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw]
    let p1, p2, p3

    p1 = vec3.dot(position, xAxis)
    p2 = vec3.dot(position, yAxis)
    p3 = vec3.dot(position, zAxis)

    return [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -p1, -p2, -p3, 1
    ]
}

export function copyTexture(target, source,  type =window.gpu.DEPTH_BUFFER_BIT) {
    const gpu = window.gpu
    gpu.bindFramebuffer(gpu.READ_FRAMEBUFFER, source.FBO)
    gpu.bindFramebuffer(gpu.DRAW_FRAMEBUFFER, target.FBO)

    gpu.blitFramebuffer(
        0, 0,
        source.width, source.height,
        0, 0,
        target.width, target.height,
        type, gpu.NEAREST)
    gpu.bindFramebuffer(gpu.FRAMEBUFFER, target.FBO)


}