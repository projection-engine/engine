import * as shaderCode from "../templates/SKYBOX.glsl"
import ShaderInstance from "../../production/libs/instances/ShaderInstance"
import {mat4} from "gl-matrix"
import RendererController from "../../production/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";


export default class BackgroundSystem {
    constructor() {
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.projection=  mat4.perspective([], 1.57, 1, .1, 1000)
    }

    execute() {

        const {gamma, background, backgroundColor} = RendererController.params
        if(background) {
            gpu.depthMask(false)
            this.shader.use()

            RendererController.cubeBuffer.enable()
            this.shader.bindForUse({
                projectionMatrix: this.projection,
                viewMatrix: CameraAPI.viewMatrix,
                gamma: gamma,
                color: backgroundColor
            })

            gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            RendererController.cubeBuffer.disable()

            gpu.depthMask(true)
        }
    }
}