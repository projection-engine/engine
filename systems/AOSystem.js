import System from "../basic/System";
import {vec3} from "gl-matrix";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/shadows/ambientOcclusion.glsl'
import FramebufferInstance from "../instances/FramebufferInstance";
import SYSTEMS from "../templates/SYSTEMS";
import {fragment} from "../shaders/shadows/ambientOcclusion.glsl";

export default class AOSystem extends System {
    _ready = false

    constructor(gpu, resolution = {w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({
                precision: this.gpu.R32F,
                format: this.gpu.RED,
                type: this.gpu.FLOAT,
                linear: true,
                repeat: false
            })

        this.blurredFrameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.blurredFrameBuffer
            .texture({
                precision: this.gpu.R32F,
                format: this.gpu.RED,
                type: this.gpu.FLOAT,
                linear: false,
                repeat: false
            })

        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.blurShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragmentBlur, gpu)


        this.#generateSamplePoints()

        this.noiseTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.noiseTexture);

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, resolution.w, resolution.h);
        gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, resolution.w, resolution.h, gpu.RG, gpu.FLOAT, generateNoise(resolution));
    }

    get texture() {
        return this.blurredFrameBuffer.colors[0]
    }

    execute(options, systems, data) {
        super.execute()
        const depth = systems[SYSTEMS.DEPTH_PRE_PASS]

        if (depth) {

            this.frameBuffer.startMapping()
            this.shader.use()
            this.shader.bindForUse({
                randomSampler: this.noiseTexture,
                depthSampler: depth.depth,
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

        for (let i = 0 ; i < KERNEL_SIZE  ; i++ ) {
            const scale = i / KERNEL_SIZE ;
            const m= (0.1 + 0.9 * scale * scale)
            const v = []
            v[0] = (2.0 * Math.random()/RAND_MAX - 1.0) * m
            v[1] = (2.0 * Math.random()/RAND_MAX - 1.0) * m
            v[2] = (2.0 * Math.random()/RAND_MAX - 1.0) * m

            this.kernels[i] = v;
        }
    }
}
function generateNoise({w, h}){
    let p = w * h
    let noiseTextureData = new Float32Array(p * 2);

    for (let i = 0; i < p; ++i) {
        let index = i * 2;
        noiseTextureData[index]     = Math.random() * 2.0 - 1.0;
        noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0;
    }

    return noiseTextureData
}
