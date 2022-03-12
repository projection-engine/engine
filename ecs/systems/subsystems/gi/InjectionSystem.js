import System from "../../../basic/System";
import {fragment, vertex} from '../../../../shaders/gi/lightInjection.glsl'
import Shader from "../../../../utils/workers/Shader";
import * as geometryShader from '../../../../shaders/gi/geometryInjection.glsl'
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";
import FramebufferInstance from "../../../../instances/FramebufferInstance";

export default class InjectionSystem extends System {
    size = 512;
    framebufferSize = 32;

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.lightInjectionShader = new Shader(vertex, fragment, gpu)
        this.geometryInjectionShader = new Shader(geometryShader.vertex, geometryShader.fragment, gpu)

        this.injectionFramebuffer = new FramebufferInstance(gpu, this.framebufferSize ** 2, this.framebufferSize)
        this.geometryInjectionFramebuffer =new FramebufferInstance(gpu, this.framebufferSize** 2, this.framebufferSize)

        this.injectionFramebuffer
            .texture(undefined, undefined, 0, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 1, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 2, undefined, undefined, undefined, undefined, true, true)

        this.geometryInjectionFramebuffer
            .texture(undefined, undefined, 0, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 1, undefined, undefined, undefined, undefined, true, true)
            .texture(undefined, undefined, 2, undefined, undefined, undefined, undefined, true, true)
        this.injection = GlobalIlluminationSystem.createPointsData(GlobalIlluminationSystem.createInjectionPointCloud(this.size), this.gpu)
    }


    execute(rsmFBO, direction) {
        this.injectionFramebuffer.use()
        this.gpu.viewport(0, 0, this.framebufferSize ** 2, this.framebufferSize)
        this.gpu.disable(this.gpu.DEPTH_TEST);
        this.gpu.enable(this.gpu.BLEND);
        this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);
        this.lightInjectionShader.use()
        this.lightInjectionShader.bindForUse({


            u_rsm_world_normals: rsmFBO.colors[0],
            u_rsm_flux: rsmFBO.colors[1],
            u_rsm_world_positions: rsmFBO.colors[2],

            u_rsm_size: this.size,
            u_grid_size: this.framebufferSize
        })
        this._draw()


        this.geometryInjectionFramebuffer.use()
        this.gpu.viewport(0, 0, this.framebufferSize ** 2, this.framebufferSize)
        this.geometryInjectionShader.use()
        this.geometryInjectionShader.bindForUse({
            u_rsm_world_normals: rsmFBO.colors[0],
            u_rsm_flux: rsmFBO.colors[1],
            u_rsm_world_positions: rsmFBO.colors[2],

            u_rsm_size: this.size,
            u_light_direction:direction ,
            u_texture_size: this.framebufferSize
        })
        this._draw()
    }
    _draw(){
        this.gpu.bindVertexArray(this.injection.pointArray)
        this.gpu.enableVertexAttribArray(0)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.injection.pointPositions)
        this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)
        this.gpu.drawArrays(this.gpu.POINTS, 0, this.injection.dataLength / 2)
    }
}
