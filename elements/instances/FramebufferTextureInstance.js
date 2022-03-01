export default class FramebufferTextureInstance {
    static generate(gpu, w, h,  attachment=gpu.COLOR_ATTACHMENT0, precision=gpu.RGBA16F, linear){
        const texture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, texture);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, linear ? gpu.LINEAR : gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, linear ? gpu.LINEAR : gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, linear ? gpu.REPEAT : gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, linear ? gpu.REPEAT : gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, precision, w,h);
        gpu.framebufferTexture2D(gpu.FRAMEBUFFER, attachment, gpu.TEXTURE_2D, texture, 0);

        return texture
    }
}
