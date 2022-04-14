import System from "../../basic/System";
import TranslationGizmo from "../../../utils/gizmo/TranslationGizmo";
import RotationGizmo from "../../../utils/gizmo/RotationGizmo";
import GIZMOS from "../../../templates/GIZMOS";
import ScaleGizmo from "../../../utils/gizmo/ScaleGizmo";
import ROTATION_TYPES from "../../../templates/ROTATION_TYPES";
import MeshInstance from "../../../instances/MeshInstance";
import cube from "../../../../../static/assets/Cube.json";
import Shader from "../../../utils/workers/Shader";
import * as gizmoShaderCode from "../../../shaders/misc/gizmo.glsl";
import COMPONENTS from "../../../templates/COMPONENTS";
import {mat4} from "gl-matrix";

export default class GizmoSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.gizmoShader = new Shader(gizmoShaderCode.vertex, gizmoShaderCode.fragment, gpu)

        const canvas = gpu.canvas
        if (gpu.canvas.id) {
            const targetID = canvas.id.replace('-canvas', '-gizmo')
            if (document.getElementById(targetID) !== null)
                this.renderTarget = document.getElementById(targetID)
            else {
                this.renderTarget = document.createElement('div')
                this.renderTarget.id = targetID
                Object.assign(this.renderTarget.style, {
                    backdropFilter: "blur(10px) brightness(70%)", borderRadius: "5px", width: "fit-content",
                    height: 'fit-content', position: 'absolute', top: '4px', left: '4px', zIndex: '10',
                    color: 'white', padding: '8px', fontSize: '.75rem',
                    display: 'none'
                });
                canvas.parentNode.appendChild(this.renderTarget)
            }

            this.translationGizmo = new TranslationGizmo(gpu, this.gizmoShader)
            this.scaleGizmo = new ScaleGizmo(gpu, this.gizmoShader)

            this.rotationGizmo = new RotationGizmo(gpu, this.renderTarget)


            this.boundingBox = new MeshInstance({
                gpu,
                vertices: cube.vertices,
                indices: cube.indices
            })
        }

    }

    getMat(t) {
        return [
            .1, 0, 0, 0,
            0, .1, 0, 0,
            0, 0, .1, 0,
            t[0], t[1], t[2], 1
        ]
    }

    execute(
        meshes,
        meshSources,
        selected,
        camera,
        pickSystem,
        lockCamera,
        entities,
        gizmo,
        transformationType = ROTATION_TYPES.GLOBAL,
        onGizmoStart,
        onGizmoEnd,
        gridSize
    ) {
        super.execute()

        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)

        if (selected.length > 0) {

            const el = entities.find(m => m.id === selected[0])
            const comp = el ? el.components[COMPONENTS.TRANSFORM] : undefined
            if (comp) {
                this.gizmoShader.use()
                this.gpu.bindVertexArray(this.boundingBox.VAO)
                this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.boundingBox.indexVBO)
                this.boundingBox.vertexVBO.enable()
                this.gizmoShader.bindForUse({
                    viewMatrix: camera.viewMatrix,
                    transformMatrix: this.getMat(comp.translation),
                    projectionMatrix: camera.projectionMatrix,

                    translation: comp.translation,
                    camPos: camera.position,
                    axis: 4,
                    selectedAxis: this.clickedAxis
                })
                this.gpu.drawElements(this.gpu.TRIANGLES, this.boundingBox.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
            }
        }


        switch (gizmo) {
            case GIZMOS.TRANSLATION:
                this.translationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd, gridSize)
                break
            case GIZMOS.ROTATION:
                this.rotationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd, gridSize)
                break
            case GIZMOS.SCALE:
                this.scaleGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd, gridSize)
                break
        }

    }
}
