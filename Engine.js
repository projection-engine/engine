import perspectiveCameraEvents from "./utils/camera/prespective/perspectiveCameraEvents";
import SphericalCamera from "./utils/camera/prespective/SphericalCamera";
import FreeCamera from "./utils/camera/prespective/FreeCamera";
import RenderLoop from "./RenderLoop";
import OrthographicCamera, {DIRECTIONS} from "./utils/camera/ortho/OrthographicCamera";
import CAMERA_TYPES from "./templates/CAMERA_TYPES";
import OrthographicCameraEvents from "./utils/camera/ortho/OrthographicCameraEvents";
import toObject from "./utils/misc/toObject";
import AOSystem from "./ecs/systems/AOSystem";
import CullingSystem from "./ecs/systems/CullingSystem";
import MeshSystem from "./ecs/systems/MeshSystem";
import PerformanceSystem from "./ecs/systems/PerformanceSystem";
import PhysicsSystem from "./ecs/systems/PhysicsSystem";
import PickSystem from "./ecs/systems/PickSystem";
import PostProcessingSystem from "./ecs/systems/PostProcessingSystem";
import ShadowMapSystem from "./ecs/systems/ShadowMapSystem";
import TransformSystem from "./ecs/systems/TransformSystem";
import SYSTEMS from "./templates/SYSTEMS";
import MATERIAL_TYPES from "./templates/MATERIAL_TYPES";
import CubeMapSystem, {STEPS_CUBE_MAP} from "./ecs/systems/CubeMapSystem";
import ScriptSystem from "./ecs/systems/ScriptSystem";
import cloneClass from "../utils/misc/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import RootCamera from "./RootCamera";
import EditorCameras from "./EditorCameras";
import CameraCubeSystem from "./ecs/systems/CameraCubeSystem";

export default class Engine extends RenderLoop {
    _systems = {}
    recompiled = false


    gizmo
    cameraData = {}

    constructor(id, gpu) {
        super(gpu);
        this.id = id
        this.gpu = gpu
        this.cameraData = new EditorCameras(id, CAMERA_TYPES.SPHERICAL, document.getElementById(id + '-canvas'))

        this.initialized = true
    }

    get camera() {
        return this.cameraData.camera
    }

    set camera(data) {
        this.cameraData.camera = data
    }

    get canvas() {
        return this.gpu.canvas
    }


    set systems(data) {
        let newSystems = {}
        data.forEach(s => {
            let key = getKey(s)

            if (key)
                newSystems[key] = s
        })
        this._systems = newSystems
    }

    get systems() {
        return this._systems
    }
    refreshCubemaps(){
        this._systems[SYSTEMS.CUBE_MAP].step = STEPS_CUBE_MAP.BASE
    }

    start(entities, materials, meshes, params, scripts = [], onGizmoStart, onGizmoEnd) {
        if (!this._inExecution && this.initialized) {
            this._inExecution = true
            if (!params.canExecutePhysicsAnimation)
                this.cameraData.cameraEvents.startTracking()
            else
                this.cameraData.cameraEvents.stopTracking()
            this._changed = true
            const camera = params.canExecutePhysicsAnimation ? this.rootCamera : this.camera

            const meshSources = toObject(meshes)
            if (typeof params.setSelected === 'function')
                this.cameraData.onClick = (currentCoords) => {
                    const p = this._systems[SYSTEMS.PICK]
                    const index = p.pickElement((shader, proj) => {
                        for (let m = 0; m < entities.length; m++) {
                            const currentInstance = entities[m]
                            const t = currentInstance.components[COMPONENTS.TRANSFORM]
                            if (currentInstance.components[COMPONENTS.MESH]) {
                                const mesh = meshSources[currentInstance.components[COMPONENTS.MESH]?.meshID]
                                if (mesh !== undefined)
                                    PickSystem.drawMesh(mesh, currentInstance, camera.viewMatrix, proj, t.transformationMatrix, shader, this.gpu)
                            } else if (t)
                                PickSystem.drawMesh(currentInstance.components[COMPONENTS.CAMERA] ? p.cameraMesh : p.mesh, currentInstance, camera.viewMatrix, proj, t.transformationMatrix, shader, this.gpu)
                        }
                    }, currentCoords, camera)
                    if (index > 0)
                        params.setSelected([entities.find(e => e.components[COMPONENTS.PICK]?.pickID[0] * 255 === index)?.id])
                    else
                        params.setSelected([])
                }

            super.start(
                this._systems,
                entities,
                materials,
                meshes,
                {
                    ...params,
                    onGizmoStart,
                    onGizmoEnd,
                    camera,
                    lockCamera: (lock) => {
                        if (lock) {
                            this.cameraData.cameraEvents.stopTracking()
                        } else
                            this.cameraData.cameraEvents.startTracking()
                    },
                    dataChanged: this._changed,
                    setDataChanged: () => this._changed = false,
                    gizmo: this.gizmo
                },
                scripts,
                () => this.camera.updatePlacement()
            )
        }
    }

    stop() {
        super.stop()
        if (this.initialized) {
            this._inExecution = false
            this.cameraData.cameraEvents.stopTracking()
        }
    }

    get cameraType() {
        return this.cameraData.cameraType
    }

    set cameraType(data) {
        this.cameraData.cameraType = data
        this.cameraData.changeCamera(data)
    }
}

function getKey(s) {
    switch (true) {
        case s instanceof CameraCubeSystem:
            return SYSTEMS.CAMERA_CUBE
        case s instanceof AOSystem:
            return SYSTEMS.AO

        case s instanceof CullingSystem:
            return SYSTEMS.CULLING

        case s instanceof MeshSystem:
            return SYSTEMS.MESH

        case s instanceof PerformanceSystem:
            return SYSTEMS.PERF

        case s instanceof PhysicsSystem:
            return SYSTEMS.PHYSICS

        case s instanceof PickSystem:
            return SYSTEMS.PICK

        case s instanceof PostProcessingSystem:
            return SYSTEMS.POSTPROCESSING

        case s instanceof ShadowMapSystem:
            return SYSTEMS.SHADOWS

        case s instanceof TransformSystem:
            return SYSTEMS.TRANSFORMATION

        case s instanceof CubeMapSystem:
            return SYSTEMS.CUBE_MAP
        case s instanceof ScriptSystem:
            return SYSTEMS.SCRIPT
        default:
            return undefined
    }
}
