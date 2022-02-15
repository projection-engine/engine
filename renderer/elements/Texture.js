export default class Texture {
    loaded = false

    constructor(src, yFlip, gpu, format = gpu.SRGB8_ALPHA8, type = gpu.RGBA, autoInit = true, repeat=false) {
        if (autoInit) {
            this._initialize(src, yFlip, gpu, format, type, repeat)
        }
    }

    _initialize(src, yFlip, gpu, format = gpu.SRGB8_ALPHA8, type = gpu.RGBA, repeat=false) {

        const anisotropicEXT = gpu.getExtension('EXT_texture_filter_anisotropic')

        const img = new Image()
        img.src = src

        img.onload = () => {
            let newTexture = gpu.createTexture()
            if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true);


            gpu.bindTexture(gpu.TEXTURE_2D, newTexture);
            gpu.texImage2D(gpu.TEXTURE_2D, 0,
                format,
                type,
                gpu.UNSIGNED_BYTE, img);

            gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER,repeat ? gpu.REPEAT :  gpu.LINEAR);
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
}