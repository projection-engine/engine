import * as shaderCode from "../templates/SKYBOX.glsl"
import ShaderInstance from "../../production/controllers/instances/ShaderInstance"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import MeshInstance from "../../production/controllers/instances/MeshInstance";
import GPU from "../../production/controllers/GPU";
import SkyboxPass from "../../production/templates/passes/SkyboxPass";


export default class BackgroundSystem {
    constructor() {
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)

    }

    execute() {

        const {gamma, background, backgroundColor} = RendererController.params
        if (background) {
            MeshInstance.finishIfUsed()

            gpu.depthMask(false)
            GPU.cubeBuffer.enable()
            this.shader.bindForUse({
                projectionMatrix: SkyboxPass.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                gamma: gamma,
                color: backgroundColor
            })

            gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            GPU.cubeBuffer.disable()

            gpu.depthMask(true)
        }
    }
}