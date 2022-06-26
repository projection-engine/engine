import System from "../../basic/System"
import ShaderInstance from "../../instances/ShaderInstance"
import * as shaderCode from "../../shaders/shadows/AO.glsl"
import FramebufferInstance from "../../instances/FramebufferInstance"

export default class AmbientOcclusionPass extends System {
    constructor(resolution = {w: window.screen.width, h: window.screen.height}) {
        super()
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
        this.#generateSamplePoints()
        this.noiseTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.noiseTexture)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, resolution.w, resolution.h)
        gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, resolution.w, resolution.h, gpu.RG, gpu.FLOAT, generateNoise(resolution))
    }

    get texture() {
        return this.blurredFrameBuffer.colors[0]
    }

    execute(options) {
        super.execute()
        const depth = window.renderer.renderingPass.depthPrePass
        const {
            total_strength, base, area,
            falloff, radius, samples
        } = options
        if (depth) {


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

    #generateSamplePoints() {
        this.kernels = []
        const RAND_MAX = 1.,
            KERNEL_SIZE = 64

        for (let i = 0; i < KERNEL_SIZE; i++) {
            const scale = i / KERNEL_SIZE
            const m = (0.1 + 0.9 * scale * scale)
            const v = []
            v[0] = (2.0 * Math.random() / RAND_MAX - 1.0) * m
            v[1] = (2.0 * Math.random() / RAND_MAX - 1.0) * m
            v[2] = (2.0 * Math.random() / RAND_MAX - 1.0) * m

            this.kernels[i] = v
        }
    }
}

function generateNoise({w, h}) {
    let p = w * h
    let noiseTextureData = new Float32Array(p * 2)

    for (let i = 0; i < p; ++i) {
        let index = i * 2
        noiseTextureData[index] = Math.random() * 2.0 - 1.0
        noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0
    }

    return noiseTextureData
}
