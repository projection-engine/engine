import * as shaderCode from "../shaders/SKYBOX.glsl"
import Engine from "../../Engine";
import CameraAPI from "../../lib/apis/CameraAPI";
import Mesh from "../../lib/instances/Mesh";
import GPUResources from "../../GPUResources";
import SkyboxPass from "../../lib/passes/rendering/SkyboxPass";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import ShadowMapPass from "../../lib/passes/rendering/ShadowMapPass";
import DeferredPass from "../../lib/passes/rendering/DeferredPass";
import DiffuseProbePass from "../../lib/passes/rendering/DiffuseProbePass";
import GPUController from "../../GPUController";


export default class BackgroundSystem {
    static shader

    static initialize() {
        BackgroundSystem.shader = GPUController.allocateShader(STATIC_SHADERS.DEVELOPMENT.BACKGROUND, shaderCode.vertex, shaderCode.fragment)
    }

    static execute() {
        if (SkyboxPass.hasRendered)
            return;
        const {gamma, background, backgroundColor} = Engine.params
        if (!background)
            return

        Mesh.finishIfUsed()
        gpu.depthMask(false)
        GPUResources.cubeBuffer.enable()
        BackgroundSystem.shader.bindForUse({
            projectionMatrix: CameraAPI.skyboxProjectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            gamma: gamma,
            color: backgroundColor,
            // debugSampler: Object.values(DiffuseProbePass.diffuseProbes)[0]?.prefiltered
        })
        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        GPUResources.cubeBuffer.disable()

        gpu.depthMask(true)

    }
}