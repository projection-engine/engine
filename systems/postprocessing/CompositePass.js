import System from "../../basic/System"
import ShaderInstance from "../../instances/ShaderInstance"
import {vertex} from "../../shaders/FXAA.glsl"
import * as shaderCode from "../../shaders/EFFECTS.glsl"
import FramebufferInstance from "../../instances/FramebufferInstance"
import {blurBox} from "../../shaders/EFFECTS.glsl"

export default class CompositePass extends System {
    constructor( postProcessingResolution={w:window.screen.width, h: window.screen.height }) {
        super()
        this.w = postProcessingResolution.w
        this.h = postProcessingResolution.h

        this.blurBuffers = []
        this.upSampledBuffers = []

        let pW = this.w, pH = this.h
        for (let i = 0; i < 4; i++) {
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

        for (let i = 0; i < 4; i++) {
            const [wW, hH] = [pW * 2, pH * 2]
            const b = new FramebufferInstance(wW, hH)
                .texture({linear: true})
            this.upSampledBuffers.push(b)

            pW = wW
            pH = hH
        }

        this.compositeShader = new ShaderInstance(vertex, shaderCode.compositeFragment,)
        this.upSamplingShader = new ShaderInstance(vertex, shaderCode.bilinearUpSampling,)
        this.brightShader = new ShaderInstance(vertex, shaderCode.brightFragment,)
        this.blurShader = new ShaderInstance(vertex, shaderCode.blurBox)
    }

    execute(options, systems, data, entities, entitiesMap, [worker, output]) {
        super.execute()
        const {
            bloomStrength,
            bloomThreshold,

            distortion,
            chromaticAberration,
            bloom,
            distortionStrength,
            chromaticAberrationStrength
        } = options.camera

        if(bloom){
            output.startMapping()
            this.brightShader.use()
            this.brightShader.bindForUse({
                sceneColor: worker.colors[0],
                threshold: bloomThreshold
            })
            output.draw()
            output.stopMapping()


            this.blurred = this.blur(output, bloomStrength)
        }

        output.startMapping()
        this.compositeShader.use()
        this.compositeShader.bindForUse({
            blurred: this.blurred,
            sceneColor: worker.colors[0],
            resolution: [this.w, this.h],
            intensity: [distortionStrength, chromaticAberrationStrength],
            settings: [distortion ? 1 : 0, chromaticAberration ? 1 : 0, bloom ? 1 : 0]
        })
        output.draw()
        output.stopMapping()
    }
    blur(fbo, bloomIntensity, blurBuffers=this.blurBuffers, upSampledBuffers=this.upSampledBuffers){
        const q = blurBuffers.length
        let blurred
        this.blurShader.use()
        for (let index = 0; index < q; index++)
            this.blurSample(index, fbo, blurBuffers)
        for (let index = 0; index < q-1; index++) {
            const current = upSampledBuffers[index]
            current.startMapping()
            this.upSamplingShader.use()
            this.upSamplingShader.bindForUse({
                blurred: blurBuffers[index].height.colors[0],
                nextSampler: blurBuffers[index + 1].height.colors[0],
                resolution: [current.width, current.height],
                bloomIntensity
            })
            current.draw()
            current.stopMapping()
            blurred = upSampledBuffers[index].colors[0]
        }
        return blurred
    }
    blurSample(level, framebuffer, blurBuffers=this.blurBuffers) {
        const shader = this.blurShader
        const {width, height} = blurBuffers[level]
        const previousColor = level > 0 ? blurBuffers[level - 1].height.colors[0] : framebuffer.colors[0]
        width.startMapping()
        shader.bindForUse({
            sceneColor: previousColor,
            resolution: [width.width, width.height],
            isWidth: true
        })
        width.draw()
        width.stopMapping()

        height.startMapping()
        shader.bindForUse({
            sceneColor: width.colors[0],
            resolution: [height.width, height.height],
            isWidth: false
        })

        height.draw()
        height.stopMapping()
    }
}