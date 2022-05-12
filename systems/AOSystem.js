import System from "../basic/System";
import {vec3} from "gl-matrix";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/shadows/ambientOcclusion.glsl'
import FramebufferInstance from "../instances/FramebufferInstance";
import SYSTEMS from "../templates/SYSTEMS";

export default class AOSystem extends System {
    _ready = false

    constructor(gpu, resolution = {w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({
                precision: this.gpu.RGBA16F,
                format: this.gpu.RGBA,
                type: this.gpu.FLOAT,
                linear: false,
                repeat: false
            })

        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.#generateSamplePoints()
    }

    execute(options, systems, data) {
        super.execute()
        const depth = systems[SYSTEMS.DEPTH_PRE_PASS]
        if (depth) {
            this.frameBuffer.startMapping()
            this.shader.use()
            this.shader.bindForUse({
                gAspectRatio: options.camera.aspectRatio,
                // gTanHalfFOV: ,

                gDepthMap: depth.depth,
                gSampleRad: 3,
                gProj: options.camera.projectionMatrix,
                gKernel: this.kernels
            })
            this.frameBuffer.draw(this.shader)
            this.frameBuffer.stopMapping()
        }
    }

    #generateSamplePoints() {
        this.kernels = []
        for (let i = 0; i < 64; i++) {
            let p = [
                Math.floor(Math.random() * 2) - 1,
                Math.floor(Math.random() * 2) - 1,
                Math.floor(Math.random() * 2)
            ]
            vec3.normalize(p, p)
            vec3.scale(p, p, Math.floor(Math.random() * 2))
            this.kernels.push(p)
        }


    }
}
