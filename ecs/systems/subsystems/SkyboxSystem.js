import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import SkyBoxShader from "../../../shaders/classes/misc/SkyBoxShader";

export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.skyboxShader = new SkyBoxShader(gpu)
    }

    execute(skyboxElement, camera) {
        super.execute()



        if (skyboxElement && !(camera instanceof OrthographicCamera)) {
            const ntVm = camera.getNotTranslatedViewMatrix()

            this.gpu.depthMask(false)
            this.skyboxShader.use()

            skyboxElement.components.SkyboxComponent.draw(
                this.skyboxShader,
                camera.projectionMatrix,
                ntVm
            )
            this.gpu.depthMask(true)
        }
    }
}