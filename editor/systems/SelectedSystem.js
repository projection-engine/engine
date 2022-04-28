import System from "../../ecs/basic/System";
import Shader from "../../utils/Shader";
import * as gizmoShaderCode from '../../shaders/misc/gizmo.glsl'
import COMPONENTS from "../../templates/COMPONENTS";

export default class SelectedSystem extends System {

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
                    transformMatrix: t.transformationMatrix,
                    index: m
                })
            }
        }
    }

    drawMesh({
            mesh,
            viewMatrix,
            projectionMatrix,
            transformMatrix,
            index
        }) {
        mesh.use()
        this.shader.bindForUse({
            projectionMatrix,
            transformMatrix,
            viewMatrix,
            index
        })

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

    }
}