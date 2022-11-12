import Engine from "../../Engine";
import CameraAPI from "../../lib/utils/CameraAPI";
import Mesh from "../../instances/Mesh";
import GPU from "../../GPU";
import SkyboxPass from "../../runtime/rendering/SkyboxPass";


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
        GPU.cubeBuffer.enable()
        BackgroundSystem.shader.bindForUse({
            projectionMatrix: CameraAPI.skyboxProjectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            gamma: gamma,
            color: backgroundColor,
            // debugSampler: OmnidirectionalShadows.cubeMaps[0].texture
        })
        gpu.drawArrays(gpu.TRIANGLES, 0, 36)
        GPU.cubeBuffer.disable()

        gpu.depthMask(true)

    }
}