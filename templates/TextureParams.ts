interface TextureParams {
    base64?: string
    img?: string | ImageBitmap | HTMLImageElement
    wrapS?: string
    wrapT?: string
    minFilter?: string
    magFilter?: string

    internalFormat?: string
    format?: string
    width?: number
    height?: number
    type?: string
    compressionRatio?: number,
    resolutionScale?: number
}

export default TextureParams