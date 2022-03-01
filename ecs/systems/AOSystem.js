import System from "../basic/System";
import AOBuffer from "../../elements/buffer/shadows/AOBuffer";
import AOBlurBuffer from "../../elements/buffer/shadows/AOBlurBuffer";
import AOShader from "../../shaders/classes/shadows/AOShader";
import {bindTexture} from "../../utils/misc/utils";
import {vec3} from "gl-matrix";
import SYSTEMS from "../../utils/misc/SYSTEMS";

export default class AOSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.aoBuffer = new AOBuffer(gpu)
        this.aoBlurBuffer = new AOBlurBuffer(gpu)

        this.baseShader = new AOShader(gpu)
        this.blurShader = new AOShader(gpu, true)

        this.samplePoints = generateSamplePoints()

        this.noiseTexture = gpu.createTexture()
        gpu.bindTexture(gpu.TEXTURE_2D, this.noiseTexture);

        gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.CLAMP_TO_EDGE);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.CLAMP_TO_EDGE);
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, gpu.drawingBufferWidth, gpu.drawingBufferHeight);
        gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, gpu.drawingBufferWidth, gpu.drawingBufferHeight, gpu.RG, gpu.FLOAT, generateNoise());
    }

    execute(options, systems, data) {
        super.execute()
        const {
            camera
        } = options

        const meshSystem = systems[SYSTEMS.MESH]
        if (meshSystem) {
            const aoFBO = this.aoBuffer
            const aoBlurFBO = this.aoBlurBuffer

            aoFBO.startMapping()
            this.baseShader.use()
            this.gpu.uniformMatrix4fv(this.baseShader.projectionULocation, false, camera.projectionMatrix)
            for (let s = 0; s < this.samplePoints.length; s++) {
                const uLocation = this.gpu.getUniformLocation(this.baseShader.program, `samples[${s}]`)
                this.gpu.uniform3fv(uLocation, this.samplePoints[s])
            }
            bindTexture(0, meshSystem.gBuffer.gPositionTexture, this.baseShader.gPositionULocation, this.gpu)
            bindTexture(1, meshSystem.gBuffer.gNormalTexture, this.baseShader.gNormalULocation, this.gpu)
            bindTexture(2, this.noiseTexture, this.baseShader.noiseULocation, this.gpu)
            aoFBO.draw(this.baseShader, true)
            aoFBO.stopMapping()

            aoBlurFBO.startMapping()
            this.blurShader.use()
            bindTexture(0, aoFBO.frameBufferTexture, this.blurShader.aoULocation, this.gpu)
            aoBlurFBO.draw(this.blurShader, true)
            aoBlurFBO.stopMapping()

        }
    }
}
function generateNoise(){
    let p = window.screen.width * window.screen.height
    let noiseTextureData = new Float32Array(p * 2);

    for (let i = 0; i < p; ++i) {
        let index = i * 2;
        noiseTextureData[index]     = Math.random() * 2.0 - 1.0;
        noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0;
    }

    return noiseTextureData
}

function generateSamplePoints() {
    let samplePoints = []
    for (let i = 0; i < 64; i++) {
        let p = [
            Math.floor(Math.random() * 2) - 1,
            Math.floor(Math.random() * 2) - 1,
            Math.floor(Math.random() * 2)
        ]
        vec3.normalize(p, p)
        vec3.scale(p, p, Math.floor(Math.random() * 2))
        samplePoints.push(p)
    }

    return samplePoints

}