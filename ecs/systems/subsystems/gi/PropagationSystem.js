import System from "../../../basic/System";
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";
import {fragment, vertex} from '../../../../shaders/gi/lightPropagation.glsl'
import Shader from "../../../../utils/workers/Shader";
import Framebuffer from "../../../../instances/Framebuffer";

export default class PropagationSystem extends System {
    size =  512;
    framebufferSize =  32;
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.shader = new Shader(vertex, fragment, gpu)


        this.propagationFramebuffer = new Framebuffer(gpu, this.framebufferSize** 2, this.framebufferSize)
        this.accumulatedBuffer =new Framebuffer(gpu, this.framebufferSize** 2, this.framebufferSize)

        this.propagationFramebuffer
            .texture(undefined, undefined, 0, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 1, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 2, undefined, undefined, undefined, undefined, true, true)

        this.accumulatedBuffer
            .texture(undefined, undefined, 0, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 1, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 2, undefined, undefined, undefined, undefined, true, true)

        const positionData = new Float32Array(this.framebufferSize * this.framebufferSize * this.framebufferSize * 2);
        let positionIndex = 0;
        for(let x = 0; x < this.framebufferSize * this.framebufferSize; x++) {
            for(let y = 0; y < this.framebufferSize; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }

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

        this.shader.use()
        for (let i = 0; i < iterations; i++) {
            lpvIndex = i & 1;
            const readLPV = LPVS[lpvIndex];
            const nextIterationLPV = LPVS[lpvIndex ^ 1];


            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, nextIterationLPV.FBO)
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)


            this._lightPropagationIteration(i, readLPV, nextIterationLPV, geometryInjectionFBO);
        }
    }
    _drawTargets(currentBuffer){

        this.accumulatedBuffer.appendTexture(
            currentBuffer.colors[0],
            3,
            true,
            false
        )
        this.accumulatedBuffer.appendTexture(
            currentBuffer.colors[1],
            4,
            false,
            false
        )
        this.accumulatedBuffer.appendTexture(
            currentBuffer.colors[2],
            5,
            false,
            true
        )




    }
    _lightPropagationIteration(iteration, readLPV, nextIterationLPV, geometryInjectionFBO) {


                this._drawTargets(nextIterationLPV)

                this.shader.bindForUse({
                    u_grid_size: this.framebufferSize,
                    u_red_contribution: readLPV.colors[0],
                    u_green_contribution: readLPV.colors[1],
                    u_blue_contribution:readLPV.colors[2],

                    u_red_geometry_volume: geometryInjectionFBO.colors[0],
                    u_green_geometry_volume: geometryInjectionFBO.colors[1],
                    u_blue_geometry_volume: geometryInjectionFBO.colors[2],

                    u_first_iteration: iteration <= 0
                })


                this.gpu.bindVertexArray(this.propagation.pointArray)
                this.gpu.enableVertexAttribArray(0)
                this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.propagation.pointPositions)
                this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)

                this.gpu.drawArrays(this.gpu.POINTS, 0, this.propagation.dataLength)

    }
}
