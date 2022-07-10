import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"
import generateBlurBuffers from "../../utils/generateBlurBuffers"


let normalSampler, deferredSystem, aoSystem, composite
export default class SSGIPass{
    SSGI
    then = performance.now()
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        const [blurBuffers,  upSampledBuffers] = generateBlurBuffers(3, resolution.w, resolution.h, 4)
        this.blurBuffers = blurBuffers
        this.upSampledBuffers = upSampledBuffers

        this.normalsFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.FBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.normalsShader = new ShaderInstance(ssGI.vShader, ssGI.stochasticNormals)
        this.ssgiShader = new ShaderInstance(ssGI.vShader, ssGI.ssGI)
    }

    get color(){
        return this.SSGI
    }
    normalPass(){
        this.normalsFBO.startMapping()
        this.normalsShader.use()
        this.normalsShader.bindForUse({
            gNormal: normalSampler,
            noise: aoSystem.noiseTexture
        })
        this.normalsFBO.draw()
        this.normalsFBO.stopMapping()
    }

    execute(options, lastFrame) {
        const {
            camera,
            ssgi,
            ssgiQuality,
            ssgiBrightness,
            ssgiStepSize,
            // ssgiKernel
        } = options

        if(ssgi) {
            if(normalSampler === undefined) {
                normalSampler = window.renderer.renderingPass.depthPrePass.normal
                deferredSystem = window.renderer.renderingPass.deferred
                aoSystem = window.renderer.renderingPass.ao
                composite = window.renderer.postProcessingPass.compositPass
            }
            this.normalPass()

            this.FBO.startMapping()
            this.ssgiShader.use()
            this.ssgiShader.bindForUse({
                previousFrame: lastFrame,
                gPosition: deferredSystem.frameBuffer.colors[0],
                gNormal: this.normalsFBO.colors[0],
                projection: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                invViewMatrix: camera.invViewMatrix,
                step:ssgiStepSize,
                maxSteps: ssgiQuality,
                intensity: ssgiBrightness,
                noiseSampler: aoSystem.noiseTexture
            })
            this.FBO.draw()
            this.FBO.stopMapping()

            this.SSGI = composite.blur(this.FBO, 1, this.blurBuffers, this.upSampledBuffers, 1.)
        }
        this.then = performance.now()
    }
}