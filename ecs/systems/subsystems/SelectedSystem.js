import System from "../../basic/System";
import MeshShader from "../../../renderer/shaders/classes/MeshShader";
import MeshSystem from "../MeshSystem";

export default class SelectedSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.meshShader = new MeshShader(gpu, true)
    }

    execute(entities, params,filteredEntities) {
        super.execute()
        const {
            meshes,
            selected,
            camera
        } = params
        if(selected) {
            this.gpu.disable(this.gpu.DEPTH_TEST)

            for (let i = 0; i < selected.length; i++) {
                const el = entities[filteredEntities.meshes[selected[i]]]
                if (el)
                    this._drawSelected(meshes[filteredEntities.meshSources[el.components.MeshComponent.meshID]], camera, el, i)
            }
            this.gpu.enable(this.gpu.DEPTH_TEST)
        }
    }
    _drawSelected(mesh, camera, element, index) {
        this.meshShader.use()
        this.gpu.uniform1i(this.meshShader.indexULocation, index)

        MeshSystem.drawMesh(
            this.meshShader,
            this.gpu,
            mesh,
            camera.position,
            camera.viewMatrix,
            camera.projectionMatrix,
            element.components.TransformComponent.transformationMatrix,
            {},
            element.components.MeshComponent.normalMatrix)
    }
}