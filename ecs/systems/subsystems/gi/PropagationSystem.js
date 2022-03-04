import System from "../../../basic/System";
import LightPropagationShader from "../../../../shaders/classes/gi/LightPropagationShader";
import GIFramebuffer from "../../../../elements/buffer/gi/GIFramebuffer";
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";
import {bindTexture, createVAO} from "../../../../utils/misc/utils";
import {vertex, fragment} from '../../../../shaders/resources/gi/lightPropagation.glsl'
import Shader from "../../../../utils/workers/Shader";
export default class PropagationSystem extends System {
    size =  512;
    framebufferSize =  32;
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        //
        // this.size = size
        // this.framebufferSize = framebufferSize

        this.shader = new Shader(vertex, fragment, gpu)

        this.propagationFramebuffer = new GIFramebuffer(this.framebufferSize, gpu)
        this.accumulatedBuffer = new GIFramebuffer(this.framebufferSize, gpu)

        const positionData = new Float32Array(this.framebufferSize * this.framebufferSize * this.framebufferSize * 2);
        let positionIndex = 0;
        for(let x = 0; x < this.framebufferSize * this.framebufferSize; x++) {
            for(let y = 0; y < this.framebufferSize; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }
        const s = new LightPropagationShader(this.gpu)
        this.program = s.program
        this.propagation = GlobalIlluminationSystem.createPointsData(positionData, this.gpu)
        this.ready = true
    }


    execute({
                iterations,
                skylight,
                lightInjectionFBO,
                geometryInjectionFBO
            }) {

        let LPVS = [ lightInjectionFBO, this.propagationFramebuffer ];
        let lpvIndex;

        this.gpu.viewport(0,0, this.framebufferSize ** 2, this.framebufferSize)
        this.gpu.disable(this.gpu.DEPTH_TEST);
        this.gpu.enable(this.gpu.BLEND);
        this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);

        for (let i = 0; i < iterations; i++) {
            lpvIndex = i & 1;
            const readLPV = LPVS[lpvIndex];
            const nextIterationLPV = LPVS[lpvIndex ^ 1];


            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, nextIterationLPV.frameBufferObject)
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)


            this._lightPropagationIteration(i, readLPV, nextIterationLPV, geometryInjectionFBO);
        }
    }
    _drawTargets(currentBuffer){
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.accumulatedBuffer.frameBufferObject);
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT3,
            this.gpu.TEXTURE_2D,
            currentBuffer.redTexture,
            0);

        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT4,
            this.gpu.TEXTURE_2D,
            currentBuffer.greenTexture,
            0);
        this.gpu.framebufferTexture2D(
            this.gpu.FRAMEBUFFER,
            this.gpu.COLOR_ATTACHMENT5,
            this.gpu.TEXTURE_2D,
            currentBuffer.blueTexture,
            0);
        this.gpu.drawBuffers([
            this.gpu.COLOR_ATTACHMENT0,
            this.gpu.COLOR_ATTACHMENT1,
            this.gpu.COLOR_ATTACHMENT2,

            this.gpu.COLOR_ATTACHMENT3,
            this.gpu.COLOR_ATTACHMENT4,
            this.gpu.COLOR_ATTACHMENT5
        ])

    }
    _lightPropagationIteration(iteration, readLPV, nextIterationLPV, geometryInjectionFBO) {


                this._drawTargets(nextIterationLPV)

                this.shader.bindForUse({
                    u_grid_size: this.framebufferSize,
                    u_red_contribution: readLPV.redTexture,
                    u_green_contribution: readLPV.greenTexture,
                    u_blue_contribution:readLPV.blueTexture,
                    u_red_geometry_volume: geometryInjectionFBO.redTexture,
                    u_green_geometry_volume: geometryInjectionFBO.greenTexture,
                    u_blue_geometry_volume: geometryInjectionFBO.blueTexture,
                    u_first_iteration: iteration <= 0
                })


                this.gpu.bindVertexArray(this.propagation.pointArray)
                this.gpu.enableVertexAttribArray(0)
                this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.propagation.pointPositions)
                this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)

                this.gpu.drawArrays(this.gpu.POINTS, 0, this.propagation.dataLength)

    }
}
