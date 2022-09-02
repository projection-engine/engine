import * as shaderCode from "../templates/SKYBOX.glsl"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/CameraAPI";
import MeshInstance from "../../production/controllers/instances/MeshInstance";
import GPU from "../../production/controllers/GPU";
import SkyboxPass from "../../production/templates/passes/SkyboxPass";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";


export default class BackgroundSystem {
    static shader
    static initialize() {
        BackgroundSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.BACKGROUND, shaderCode.vertex, shaderCode.fragment)
    }

    static execute() {

        const {gamma, background, backgroundColor} = RendererController.params
        if (background) {
            MeshInstance.finishIfUsed()

            gpu.depthMask(false)
            GPU.cubeBuffer.enable()
            BackgroundSystem.shader.bindForUse({
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