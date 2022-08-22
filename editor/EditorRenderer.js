import RendererController from "../production/RendererController"
import {STEPS_CUBE_MAP} from "../production/libs/passes/rendering/SpecularProbePass"
import Wrapper from "./services/Wrapper"
import MaterialInstance from "../production/libs/instances/MaterialInstance"
import * as debugCode from "./templates/DEBUG.glsl"
import * as shaderCode from "../production/data/shaders/FALLBACK.glsl"
import DATA_TYPES from "../production/data/DATA_TYPES"
import SHADING_MODELS from "../../../data/misc/SHADING_MODELS"
import {STEPS_LIGHT_PROBE} from "../production/libs/passes/rendering/DiffuseProbePass"
import BundlerAPI from "../production/libs/apis/BundlerAPI"
import ENVIRONMENT from "../production/data/ENVIRONMENT"
import MeshInstance from "../production/libs/instances/MeshInstance"
import sphere from "./data/SPHERE.json"
import camera from "./data/CAMERA.json"
import LoopAPI from "../production/libs/apis/LoopAPI";
import CameraTracker from "./libs/CameraTracker";

export default class EditorRenderer extends RendererController {
    gizmo
    cursor
    selected = []
    static sphereMesh
    static cameraMesh
    static cubeMesh

    constructor(resolution) {
        super(resolution)
        RendererController.environment = ENVIRONMENT.DEV
        this.editorSystem = new Wrapper(resolution)
        this.debugMaterial = new MaterialInstance({
            vertex: shaderCode.vertex,
            fragment: debugCode.fragment,
            uniformData: [{
                key: "shadingModel",
                data: SHADING_MODELS.DEPTH,
                type: DATA_TYPES.INT
            }],
            settings: {
                isForwardShaded: true,
                doubledSided: true
            },
            id: "shading-models"
        })

        EditorRenderer.sphereMesh = new MeshInstance({
            ...sphere,
            uvs: [],
            tangents: [],
        })
        EditorRenderer.cameraMesh = new MeshInstance({
            ...camera,
            uvs: [],
            tangents: [],
        })
        EditorRenderer.cubeMesh = new MeshInstance({
            vertices: [-1, -1, 1, -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1],
            indices: [0, 3, 9, 0, 9, 6, 8, 10, 21, 8, 21, 19, 20, 23, 17, 20, 17, 14, 13, 15, 4, 13, 4, 2, 7, 18, 12, 7, 12, 1, 22, 11, 5, 22, 5, 16]
        })
    }

    generatePreview(material) {
        return this.editorSystem.previewSystem.execute(this.data, material)
    }

    generateMeshPreview(entity, mesh) {
        return this.editorSystem.previewSystem.execute(this.data, mesh, entity)
    }

    get gizmos() {
        return {
            rotation: this.editorSystem.gizmoSystem.rotationGizmo,
            translation: this.editorSystem.gizmoSystem.translationGizmo,
            scale: this.editorSystem.gizmoSystem.scaleGizmo
        }
    }

    refreshProbes() {
        LoopAPI.renderMap.get("diffuseProbe").step = STEPS_CUBE_MAP.BASE
        LoopAPI.renderMap.get("specularProbe").step = STEPS_LIGHT_PROBE.GENERATION
    }

    updatePackage(prodEnv, params) {
        RendererController.environment = prodEnv ? ENVIRONMENT.EXECUTION : ENVIRONMENT.DEV
        if (!prodEnv)
            CameraTracker.startTracking()
        else
            CameraTracker.stopTracking()

        this.debugMaterial.uniformData.shadingModel = params.shadingModel
        BundlerAPI.build(
            {
                ...params,
                gizmo: this.gizmo,
                cursor: this.cursor,
                onWrap: prodEnv ? null : this.editorSystem,
            })
    }

    arrayToObject(arr) {
        const obj = {}
        arr.forEach(a => {
            obj[a] = true
        })
        return obj
    }

    stop() {
        super.stop()
        CameraTracker.stopTracking()
    }

}

