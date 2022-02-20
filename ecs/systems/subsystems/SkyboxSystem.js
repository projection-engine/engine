import System from "../../basic/System";
import OrthographicCamera from "../../../camera/ortho/OrthographicCamera";
import SkyBoxShader from "../../../renderer/shaders/classes/SkyBoxShader";

export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.skyboxShader = new SkyBoxShader(gpu)
    }

    execute(entities, params) {
        super.execute()
        const {
            camera
        } = params
        const skyboxElement = this._find(entities, e => e.components.SkyboxComponent && e.components.SkyboxComponent.active)[0]

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