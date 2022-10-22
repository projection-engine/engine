import * as shaderCode from "../shaders/SKYBOX.glsl"
import Engine from "../../Engine";
import CameraAPI from "../../lib/apis/CameraAPI";
import MeshController from "../../lib/instances/MeshController";
import GPU from "../../GPU";
import SkyboxPass from "../../lib/passes/rendering/SkyboxPass";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";


export default class BackgroundSystem {
    static shader

    static initialize() {
        BackgroundSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.BACKGROUND, shaderCode.vertex, shaderCode.fragment)
    }

    static execute() {
        if (SkyboxPass.hasRendered)
            return;
        const {gamma, background, backgroundColor} = Engine.params
        if (!background)
            return

        MeshController.finishIfUsed()
        gpu.depthMask(false)
        GPU.cubeBuffer.enable()
        BackgroundSystem.shader.bindForUse({
            projectionMatrix: CameraAPI.skyboxProjectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            gamma: gamma,
            color: backgroundColor
        })

        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        GPU.cubeBuffer.disable()

        gpu.depthMask(true)

    }
}