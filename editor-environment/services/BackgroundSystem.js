import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import Mesh from "../../instances/Mesh";
import GPUResources from "../../GPUResources";
import SkyboxPass from "../../runtime/renderers/SkyboxPass";
import OmnidirectionalShadows from "../../runtime/occlusion/OmnidirectionalShadows";


export default class BackgroundSystem {
    static shader

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
            debugSampler: OmnidirectionalShadows.cubeMaps[0].texture
        })
        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        GPUResources.cubeBuffer.disable()

        gpu.depthMask(true)

    }
}