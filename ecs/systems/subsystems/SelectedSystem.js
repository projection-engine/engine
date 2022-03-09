import System from "../../basic/System";
import MeshSystem from "../MeshSystem";
import Shader from "../../../utils/workers/Shader";
import * as shaderCode from "../../../shaders/mesh/meshSelected.glsl";

export default class SelectedSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(meshes, meshSources, selected, camera) {
        super.execute()

        if (selected) {
            this.shader.use()

            for (let i = 0; i < selected.length; i++) {
                const el = meshes.find(m => m.id === selected[i])

                if (el)
                    MeshSystem.drawMesh(
                        this.shader,
                        this.gpu,
                        meshSources[el.components.MeshComponent.meshID],
                        camera.position,
                        camera.viewMatrix,
                        camera.projectionMatrix,
                        el.components.TransformComponent.transformationMatrix,
                        undefined,
                        el.components.MeshComponent.normalMatrix,
                        i)


            }

        }
    }
}