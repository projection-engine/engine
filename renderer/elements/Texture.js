export default class Texture {
    loaded = false

    constructor(img, yFlip, gpu, format = gpu.SRGB8_ALPHA8, type = gpu.RGBA,  repeat = false) {
        console.log(img)
        const anisotropicEXT = gpu.getExtension('EXT_texture_filter_anisotropic')

        let newTexture = gpu.createTexture()
        if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true);

        gpu.bindTexture(gpu.TEXTURE_2D, newTexture);
        gpu.texImage2D(gpu.TEXTURE_2D, 0,
            format,
            type,
            gpu.UNSIGNED_BYTE, img);

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR_MIPMAP_LINEAR);

        if (anisotropicEXT) {
            const anisotropicAmountMin = 8
            const anisotropicAmount = Math.min(anisotropicAmountMin, gpu.getParameter(anisotropicEXT.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
            gpu.texParameterf(gpu.TEXTURE_2D, anisotropicEXT.TEXTURE_MAX_ANISOTROPY_EXT, anisotropicAmount);
        }
        gpu.generateMipmap(gpu.TEXTURE_2D);

        gpu.bindTexture(gpu.TEXTURE_2D, null);

        this.texture = newTexture

        this.loaded = true
    }
}