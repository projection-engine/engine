import ShaderInstance from "../../instances/ShaderInstance"
import {vertex} from "../../shaders/FXAA.glsl"
import * as shaderCode from "../../shaders/EFFECTS.glsl"
import generateBlurBuffers from "../../utils/generateBlurBuffers"

export default class CompositePass {
    constructor( resolution={w:window.screen.width, h: window.screen.height }) {
        this.w = resolution.w
        this.h = resolution.h

        const [blurBuffers,  upSampledBuffers] = generateBlurBuffers(4, resolution.w, resolution.h)
        this.blurBuffers = blurBuffers
        this.upSampledBuffers = upSampledBuffers

        this.compositeShader = new ShaderInstance(vertex, shaderCode.compositeFragment,)
        this.upSamplingShader = new ShaderInstance(vertex, shaderCode.bilinearUpSampling,)
        this.brightShader = new ShaderInstance(vertex, shaderCode.brightFragment,)
        this.blurShader = new ShaderInstance(vertex, shaderCode.blurBox)
    }

    execute(options, data, entities, entitiesMap, worker, output) {
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
    blur(fbo, bloomIntensity, blurBuffers=this.blurBuffers, upSampledBuffers=this.upSampledBuffers, kernel=7){
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
        for (let index = 0; index < q-1; index++) {
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
        return upSampledBuffers[q-2].colors[0]
    }
}