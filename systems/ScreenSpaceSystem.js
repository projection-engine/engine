import System from "../basic/System"
import SYSTEMS from "../templates/SYSTEMS"
import FramebufferInstance from "../instances/FramebufferInstance"
import ShaderInstance from "../instances/ShaderInstance"
import * as ssGI from "../shaders/SCREEN_SPACE.glsl"


let normalSampler
export default class ScreenSpaceSystem extends System {

    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        super()

        this.blurBuffers = []
        this.upSampledBuffers = []

        let pW = resolution.w, pH = resolution.h
        for (let i = 0; i < 3; i++) {
            const [wW, hH] = [pW / 2, pH / 2]
            const wBlurFrameBuffer = new FramebufferInstance( wW, hH)
            wBlurFrameBuffer
                .texture({linear: true})
            const hBlurFrameBuffer = new FramebufferInstance( wW, hH)
            hBlurFrameBuffer
                .texture({linear: true})
            this.blurBuffers.push({
                height: hBlurFrameBuffer,
                width: wBlurFrameBuffer
            })

            pW = wW
            pH = hH
        }

        for (let i = 0; i < 3; i++) {
            const [wW, hH] = [pW * 2, pH * 2]
            const b = new FramebufferInstance(wW, hH).texture({linear: true})
            this.upSampledBuffers.push(b)

            pW = wW
            pH = hH
        }

        this.ssrFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.normalsFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.ssgiFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()

        this.normalsShader = new ShaderInstance(ssGI.vShader, ssGI.stochasticNormals)
        this.ssrShader = new ShaderInstance(ssGI.vShader, ssGI.fragment)
        this.ssgiShader = new ShaderInstance(ssGI.vShader, ssGI.ssGI)

    }

    get ssColor(){
        return this.ssrFBO.colors[0]
    }

    get normals(){
        return this.normalsFBO.colors[0]
    }
    execute(options, systems) {
        super.execute()
        const {
            camera,
            lastFrame,
            ssr,
            ssgi,
            ssgiQuality,
            ssgiBrightness
        } = options

        const deferredSystem = systems[SYSTEMS.MESH]
        if(!normalSampler){
            normalSampler =  systems[SYSTEMS.DEPTH_PRE_PASS].normal
        }

        const aoSystem = systems[SYSTEMS.AO]
        const composite = window.renderer.postProcessingWrapper.compositPass

        if(ssgi) {
            // NORMALS
            this.normalsFBO.startMapping()
            this.normalsShader.use()
            this.normalsShader.bindForUse({
                gNormal: normalSampler,
                noise: aoSystem.noiseTexture
            })
            this.normalsFBO.draw()
            this.normalsFBO.stopMapping()

            this.ssgiFBO.startMapping()
            this.ssgiShader.use()
            this.ssgiShader.bindForUse({
                previousFrame: lastFrame,
                gPosition: deferredSystem.frameBuffer.colors[0],
                gNormal: this.normals,
                projection: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                invViewMatrix: camera.invViewMatrix,
                depthSampler: systems[SYSTEMS.DEPTH_PRE_PASS].depth,
                stepSize: .5,
                maxSteps: ssgiQuality,
                intensity: ssgiBrightness
            })
            this.ssgiFBO.draw()
            this.ssgiFBO.stopMapping()

            this.SSGI = composite.blur(this.ssgiFBO, 1, this.blurBuffers, this.upSampledBuffers)
        }
        
        // SSR
        if(ssr) {
            this.ssrFBO.startMapping()
            this.ssrShader.use()
            this.ssrShader.bindForUse({
                previousFrame: lastFrame, // ALBEDO
                gPosition: deferredSystem.frameBuffer.colors[0],
                gNormal: normalSampler,
                gBehaviour: deferredSystem.frameBuffer.colors[3],
                projection: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                invViewMatrix: camera.invViewMatrix,
                stepSize: .1,
                maxSteps: 30
            })
            this.ssrFBO.draw()
            this.ssrFBO.stopMapping()
        }
    }
}