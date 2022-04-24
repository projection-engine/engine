import System from "../../basic/System";
import Shader from "../../../utils/workers/Shader";
import {vertex} from '../../../shaders/misc/postProcessing.glsl'
import * as shaderCode from '../../../shaders/misc/bloom.glsl'
import FramebufferInstance from "../../../instances/FramebufferInstance";

export default class Bloom extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.w = window.screen.width
        this.h = window.screen.height

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
        this.blurShader = new Shader(shaderCode.blurVertex, shaderCode.blur, gpu)
        this.blurShaderB = new Shader(vertex, shaderCode.blurBox, gpu)

    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()
        const {
            gamma,
            exposure
        } = options

        b.startMapping()
        this.brightShader.use()
        this.brightShader.bindForUse({
            sceneColor: a.colors[0],
            threshold: .85
        })
        b.draw()
        b.stopMapping()


        this.blurShaderB.use()
        for (let index = 0; index < 4; index++) {
            this.blurSample(index, this.blurShaderB,  b)
        }
        for (let index = 0; index < 3; index++) {
            const current = this.upSampledBuffers[index]
            current.startMapping()
            this.upSamplingShader.use()
            this.upSamplingShader.bindForUse({
                blurred: this.blurBuffers[index].height.colors[0],
                nextSampler: this.blurBuffers[index + 1].height.colors[0],
                resolution: [current.width, current.height]
            })
            current.draw()
            current.stopMapping()
        }

        b.startMapping()
        this.blurShader.use()
        this.compositeShader.use()
        this.compositeShader.bindForUse({
            blurred: this.upSampledBuffers[2].colors[0],
            sceneColor: a.colors[0],
            resolution: [this.w, this.h],
            gamma,
            exposure
        })
        b.draw()
        b.stopMapping()
    }

    blurSample(level, shader = this.blurShaderB, a) {
        const {width, height} = this.blurBuffers[level]
        const previousColor = level > 0 ? this.blurBuffers[level - 1].height.colors[0] : a.colors[0]
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