import System from "../../basic/System";
import Shader from "../../../utils/workers/Shader";
import * as gizmoShaderCode from '../../../shaders/misc/gizmo.glsl'
import COMPONENTS from "../../../templates/COMPONENTS";

export default class SelectedSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(gizmoShaderCode.selectedVertex, gizmoShaderCode.selectedFragment, gpu)
    }


    execute(selected, meshSources, camera, entitiesMap) {
        super.execute()
        this.shader.use()
        for (let m = 0; m < selected.length; m++) {
            const current = entitiesMap[selected[m]]
            const mesh = meshSources[current.components[COMPONENTS.MESH]?.meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                this.drawMesh({
                    mesh,
                    viewMatrix: camera.viewMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    transformMatrix: t.transformationMatrix
                })
            }
        }
    }

    drawMesh({
            mesh,
            viewMatrix,
            projectionMatrix,
            transformMatrix
        }) {
        mesh.use()
        this.shader.bindForUse({
            projectionMatrix,
            transformMatrix,
            viewMatrix
        })

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

    }
}