import ShaderInstance from "../../instances/ShaderInstance"
import * as shaderCode from "../../shaders/shadows/AO.glsl"
import FramebufferInstance from "../../instances/FramebufferInstance"
import IMAGE_WORKER_ACTIONS from "../../templates/IMAGE_WORKER_ACTIONS"

let depth
export default class AmbientOcclusionPass {
    ready = false
    constructor(resolution = {w: window.screen.width, h: window.screen.height}) {
        const gpu = window.gpu
        this.frameBuffer = new FramebufferInstance( resolution.w, resolution.h)
        this.frameBuffer
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })

        this.blurredFrameBuffer = new FramebufferInstance( resolution.w, resolution.h)
        this.blurredFrameBuffer
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })

        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.blurShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragmentBlur)
        
        
        
        window.imageWorker(IMAGE_WORKER_ACTIONS.NOISE_DATA, resolution)
            .then(({kernels, noise}) => {
                this.kernels = kernels
                this.noiseTexture = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, this.noiseTexture)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, resolution.w, resolution.h)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, resolution.w, resolution.h, gpu.RG, gpu.FLOAT, noise)
                this.ready = true
            })
        
    
    }

    get texture() {
        return this.blurredFrameBuffer.colors[0]
    }

    execute(options) {
        const {
            total_strength, base, area,
            falloff, radius, samples,
            ao
        } = options
        if(ao && this.ready) {
            if(!depth)
                depth = window.renderer.renderingPass.depthPrePass
            this.frameBuffer.startMapping()
            this.shader.use()
            this.shader.bindForUse({
                randomSampler: this.noiseTexture,
                depthSampler: depth.depth,
                settings: [
                    total_strength, base, area,
                    falloff, radius, samples,
                    0, 0, 0
                ],
                normalSampler: depth.normal
            })
            this.frameBuffer.draw(this.shader)
            this.frameBuffer.stopMapping()


            this.blurredFrameBuffer.startMapping()
            this.blurShader.use()
            this.blurShader.bindForUse({
                aoSampler: this.frameBuffer.colors[0]
            })
            this.blurredFrameBuffer.draw(this.blurShader)
            this.blurredFrameBuffer.stopMapping()
        }
    }

}

