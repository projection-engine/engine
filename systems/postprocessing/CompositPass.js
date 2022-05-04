import System from "../../basic/System";
import Shader from "../../utils/Shader";
import {vertex} from '../../shaders/misc/postProcessing.glsl'
import * as shaderCode from '../../shaders/misc/bloom.glsl'
import FramebufferInstance from "../../instances/FramebufferInstance";

export default class CompositPass extends System {
    constructor(gpu, postProcessingResolution={w:window.screen.width, h: window.screen.height }) {
        super([]);
        this.gpu = gpu
        this.w = postProcessingResolution.w
        this.h = postProcessingResolution.h

        this.blurBuffers = []
        this.upSampledBuffers = []

        let pW = this.w, pH = this.h
        for (let i = 0; i < 4; i++) {
            const [wW, hH] = [pW / 2, pH / 2]
            const wBlurFrameBuffer = new FramebufferInstance(gpu, wW, hH)
            wBlurFrameBuffer
                .texture({linear: true})
            const hBlurFrameBuffer = new FramebufferInstance(gpu, wW, hH)
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
            const b = new FramebufferInstance(gpu, wW, hH)
                .texture({linear: true})
            this.upSampledBuffers.push(b)

            pW = wW
            pH = hH
        }

        this.compositeShader = new Shader(vertex, shaderCode.compositeFragment, gpu)
        this.upSamplingShader = new Shader(vertex, shaderCode.bilinearUpSampling, gpu)
        this.brightShader = new Shader(vertex, shaderCode.brightFragment, gpu)
        this.blurShader = new Shader(vertex, shaderCode.blurBox, gpu)
    }

    execute(options, systems, data, entities, entitiesMap, [worker, output]) {
        super.execute()
        const {
            bloomStrength,
            bloomThreshold,

            distortion,
            chromaticAberration,
            bloom,
            distortionStrength, chromaticAberrationStrength
        } = options

        if(bloom){
            output.startMapping()
            this.brightShader.use()
            this.brightShader.bindForUse({
                sceneColor: worker.colors[0],
                threshold: bloomThreshold
            })
            output.draw()
            output.stopMapping()


            this.blurShader.use()
            for (let index = 0; index < 4; index++) {
                this.blurSample(index, this.blurShader,  output)
            }
            for (let index = 0; index < 3; index++) {
                const current = this.upSampledBuffers[index]
                current.startMapping()
                this.upSamplingShader.use()
                this.upSamplingShader.bindForUse({
                    blurred: this.blurBuffers[index].height.colors[0],
                    nextSampler: this.blurBuffers[index + 1].height.colors[0],
                    resolution: [current.width, current.height],
                    bloomIntensity: bloomStrength
                })
                current.draw()
                current.stopMapping()
            }
        }

        output.startMapping()
        this.compositeShader.use()
        this.compositeShader.bindForUse({
            blurred: this.upSampledBuffers[2].colors[0],
            sceneColor: worker.colors[0],
            resolution: [this.w, this.h],
            intensity: [distortionStrength, chromaticAberrationStrength],
            settings: [distortion ? 1 : 0, chromaticAberration ? 1 : 0, bloom ? 1 : 0]
        })
        output.draw()
        output.stopMapping()
    }

    blurSample(level, shader = this.blurShader, framebuffer) {
        const {width, height} = this.blurBuffers[level]
        const previousColor = level > 0 ? this.blurBuffers[level - 1].height.colors[0] : framebuffer.colors[0]
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