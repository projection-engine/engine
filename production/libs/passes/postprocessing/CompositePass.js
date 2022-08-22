import ShaderInstance from "../../instances/ShaderInstance"
import {vertex} from "../../../data/shaders/FXAA.glsl"
import * as shaderCode from "../../../data/shaders/EFFECTS.glsl"
import generateBlurBuffers from "../../../utils/generate-blur-buffers"
import CameraAPI from "../../apis/CameraAPI";

let shaderState
export default class CompositePass {
    constructor(resolution = {w: window.screen.width, h: window.screen.height}) {
        this.w = resolution.w
        this.h = resolution.h
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(4, resolution.w, resolution.h)
        this.blurBuffers = blurBuffers
        this.upSampledBuffers = upSampledBuffers

        this.compositeShader = new ShaderInstance(vertex, shaderCode.compositeFragment,)
        this.upSamplingShader = new ShaderInstance(vertex, shaderCode.bilinearUpSampling,)
        this.brightShader = new ShaderInstance(vertex, shaderCode.brightFragment,)
        this.blurShader = new ShaderInstance(vertex, shaderCode.blurBox)
    }

    execute(entities, worker, output) {
        const {
            bloomStrength,
            bloomThreshold,
            bloom,
            postProcessingStrength,
            postProcessingEffects
        } = CameraAPI.metadata



        if (bloom) {
            output.startMapping()
            this.brightShader.use()
            this.brightShader.bindForUse({
                sceneColor: worker.colors[0],
                threshold: bloomThreshold
            })
            output.draw()
            output.stopMapping()
            this.blurred = this.blur(output, bloomStrength)
            if(!shaderState?.blurred)
                shaderState.blurred = this.blurred
        }
        if(!shaderState)
            shaderState = {
                blurred: this.blurred,
                resolution:  [this.w, this.h],
                sceneColor: worker.colors[0],
                intensity: postProcessingStrength,
                settings: postProcessingEffects
            }
        output.startMapping()
        this.compositeShader.use()
        this.compositeShader.bindForUse(shaderState)
        output.draw()
        output.stopMapping()
    }

    blur(fbo, bloomIntensity, blurBuffers = this.blurBuffers, upSampledBuffers = this.upSampledBuffers, kernel = 7) {
        const q = blurBuffers.length

        this.blurShader.use()
        for (let level = 0; level < q; level++) {
            const {width, height} = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].height.colors[0] : fbo.colors[0]
            width.startMapping()
            this.blurShader.bindForUse({
                sceneColor: previousColor,
                resolution: [width.width, width.height],
                isWidth: true,
                kernel
            })
            width.draw()
            width.stopMapping()

            height.startMapping()
            this.blurShader.bindForUse({
                sceneColor: width.colors[0],
                resolution: [height.width, height.height],
                isWidth: false
            })
            height.draw()
            height.stopMapping()
        }

        this.upSamplingShader.use()
        for (let index = 0; index < q - 1; index++) {
            const current = upSampledBuffers[index]
            current.startMapping()
            this.upSamplingShader.bindForUse({
                blurred: blurBuffers[index].height.colors[0],
                nextSampler: blurBuffers[index + 1].height.colors[0],
                resolution: [current.width, current.height],
                bloomIntensity
            })
            current.draw()
            current.stopMapping()
        }
        return upSampledBuffers[q - 2].colors[0]
    }
}