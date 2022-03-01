import System from "../../../basic/System";
import LightPropagationShader from "../../../../shaders/classes/gi/LightPropagationShader";
import GIFramebuffer from "../../../../elements/buffer/gi/GIFramebuffer";
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";
import {createVAO} from "../../../../utils/misc/utils";
import VBO from "../../../../utils/workers/VBO";

export default class LightPropagationSystem extends System {

    constructor(gpu, size, gridSize) {
        super([]);
        this.gpu = gpu

        this._size = size
        this._gridSize = gridSize

        this.shader = new LightPropagationShader(gpu)

        this.lpFBO = new GIFramebuffer(gridSize, gpu)
        this.alFBO = new GIFramebuffer(gridSize, gpu)


        const positionData = new Float32Array((gridSize ** 3) * 2);
        let positionIndex = 0;
        for (let x = 0; x < gridSize * gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }

        this.pointArray = createVAO(gpu)
        this.pointPositions = new VBO(gpu, 0,positionData, gpu.ARRAY_BUFFER, 2, gpu.FLOAT)
    }


    execute(rsmFBO, skylight, rsmSamples, injectionFinished, geometryInjectionFinished, lightInjectionFBO,  geometryInjectionFBO) {

        let LPVS = [lightInjectionFBO, this.lpFBO];
        let lpvIndex;


        for (let i = 0; i < rsmSamples; i++) {
            lpvIndex = i & 1;
            const readLPV = LPVS[lpvIndex];
            const nextIterationLPV = LPVS[lpvIndex ^ 1];

            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, nextIterationLPV.frameBufferObject);
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);

            this._lightPropagationIteration(i, readLPV, nextIterationLPV,  injectionFinished, geometryInjectionFinished, geometryInjectionFBO)

        }
    }

    _lightPropagationIteration(iteration, readLPV, nextIterationLPV, injectionFinished, geometryInjectionFinished, geometryInjectionFBO) {

        if (injectionFinished && geometryInjectionFinished) {

            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.alFBO.frameBufferObject);

            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT3,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.redTexture,
                0);
            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT4,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.greenTexture,
                0);
            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT5,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.blueTexture,
                0);
            this.gpu.drawBuffers([
                this.gpu.COLOR_ATTACHMENT0,
                this.gpu.COLOR_ATTACHMENT1,
                this.gpu.COLOR_ATTACHMENT2,

                this.gpu.COLOR_ATTACHMENT3,
                this.gpu.COLOR_ATTACHMENT4,
                this.gpu.COLOR_ATTACHMENT5
            ])





            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.alFBO.frameBufferObject)

            this.gpu.viewport(0,0, this._gridSize ** 2, this._gridSize)
            this.gpu.disable(this.gpu.DEPTH_TEST);
            this.gpu.enable(this.gpu.BLEND);
            this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);

            this.shader.use()
            this.firstIteration = iteration <= 0;

            this.gpu.bindVertexArray(this.pointArray)
            this.pointPositions.enable()
            this.shader.bindUniforms(
                readLPV.redTexture,
                readLPV.greenTexture,
                readLPV.blueTexture,

                geometryInjectionFBO.redTexture,
                geometryInjectionFBO.greenTexture,
                geometryInjectionFBO.blueTexture,

                this.firstIteration,
                this._gridSize
            )


            this.gpu.drawArrays(this.gpu.POINTS, 0, this.pointPositions.length/2)
            this.gpu.bindVertexArray(null)
            this.pointPositions.disable()
        }
    }
}
