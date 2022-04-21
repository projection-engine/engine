import System from "../../basic/System";
import Shader from "../../../utils/workers/Shader";
import {vertex} from '../../../shaders/misc/postProcessing.glsl'
import * as shaderCode from '../../../shaders/misc/bloom.glsl'
import FramebufferInstance from "../../../instances/FramebufferInstance";
import {blur, brightFragment, compositeFragment} from "../../../shaders/misc/bloom.glsl";

export default class Bloom extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        const [w, h] = [window.screen.width / 2, window.screen.height / 2]
        this.brightFrameBuffer = new FramebufferInstance(gpu, w, h)
        this.brightFrameBuffer
            .texture()

        this.blurBuffers = []
        this.upSampledBuffers = []

        let pW = window.screen.width, pH = window.screen.height
        for (let i = 0; i < 4; i++) {
            const [wW, hH] = [pW / 2, pH / 2]
            const wBlurFrameBuffer = new FramebufferInstance(gpu, wW, hH)
            wBlurFrameBuffer
                .texture()
            const hBlurFrameBuffer = new FramebufferInstance(gpu, wW, hH)
            hBlurFrameBuffer
                .texture()
            this.blurBuffers.push({
                height: hBlurFrameBuffer,
                width: wBlurFrameBuffer
            })

            console.log(
                wW, hH
            )
            pW = wW
            pH = hH
        }

        for (let i = 0; i < 4; i++) {
            const [wW, hH] = [pW * 2, pH * 2]
            const b = new FramebufferInstance(gpu, wW, hH)
            b.texture()
            this.upSampledBuffers.push(b)

            pW = wW
            pH = hH
        }

        this.compositeShader = new Shader(vertex, shaderCode.compositeFragment, gpu)
        this.upSamplingShader = new Shader(vertex, shaderCode.bilinearUpSampling, gpu)
        this.brightShader = new Shader(vertex, shaderCode.brightFragment, gpu)
        this.blurShader = new Shader(shaderCode.blurVertex, shaderCode.blur, gpu)
    }

    execute(options, systems, data, entities, entitiesMap, sceneColor) {
        super.execute()

        this.brightFrameBuffer.startMapping()
        this.brightShader.use()
        this.brightShader.bindForUse({
            sceneColor: sceneColor,
            threshold: .3
        })
        this.brightFrameBuffer.draw()
        this.brightFrameBuffer.stopMapping()


        this.blurShader.use()
        for (let b = 0; b < 4; b++) {
            const {width, height} = this.blurBuffers[b]
            const previousColor = b > 0 ? this.blurBuffers[b - 1].height.colors[0] : this.brightFrameBuffer.colors[0]
            width.startMapping()
            this.blurShader.bindForUse({
                sceneColor: previousColor,
                resolution: [width.width, width.height],
                isWidth: true
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
        for (let b = 0; b < 3; b++) {
            const current = this.upSampledBuffers[b]
            current.startMapping()
            this.upSamplingShader.use()
            this.upSamplingShader.bindForUse({
                blurred: this.blurBuffers[b].height.colors[0],
                nextSampler: this.blurBuffers[b + 1].height.colors[0],
                resolution: [current.width, current.height]
            })
            current.draw()
            current.stopMapping()
        }


        this.compositeShader.use()
        this.compositeShader.bindForUse({
            blurred: this.upSampledBuffers[2].colors[0],
             sceneColor,
            resolution: [1920, 1080]
        })
        this.brightFrameBuffer.draw()
    }
}