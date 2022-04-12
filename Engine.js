import perspectiveCameraEvents from "./utils/camera/prespective/perspectiveCameraEvents";
import SphericalCamera from "./utils/camera/prespective/SphericalCamera";
import FreeCamera from "./utils/camera/prespective/FreeCamera";
import RenderLoop from "./utils/workers/RenderLoop";
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
import CubeMapSystem from "./ecs/systems/CubeMapSystem";
import ScriptSystem from "./ecs/systems/ScriptSystem";
import cloneClass from "../utils/misc/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import RootCamera from "./RootCamera";
import EditorCameras from "./EditorCameras";

export default class Engine extends RenderLoop {
    _systems = {}
    recompiled = false
    rootCamera = new RootCamera()

    gizmo
    cameraData = {}

    constructor(id, gpu) {
        super();
        this.id = id
        this.gpu = gpu
        this.cameraData = new EditorCameras(id, CAMERA_TYPES.SPHERICAL,document.getElementById(id + '-canvas'))

        this.initialized=  true
    }

    get camera(){
        return this.cameraData.camera
    }
    set camera(data){
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


    start(entities, materials, meshes, params, scripts = [], onGizmoStart, onGizmoEnd) {
        if (!this._inExecution && this.initialized) {
            this._inExecution = true
            if (!params.canExecutePhysicsAnimation)
                this.cameraData.cameraEvents.startTracking()
            else
                this.cameraData.cameraEvents.stopTracking()
            const filteredEntities = (params.canExecutePhysicsAnimation ? entities.map(e => cloneClass(e)) : entities).filter(e => e.active)
            const data = {
                pointLights: filteredEntities.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
                spotLights: filteredEntities.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
                terrains: filteredEntities.filter(e => e.components[COMPONENTS.TERRAIN]),
                translucentMeshes: toObject(filteredEntities.filter(e => {
                    if (e.components[COMPONENTS.MATERIAL]) {
                        const material = materials.find(m => m.id === e.components[COMPONENTS.MATERIAL].materialID)
                        return material && material.type === MATERIAL_TYPES.TRANSPARENT
                    } else
                        return false
                })),
                meshes: filteredEntities.filter(e => e.components[COMPONENTS.MESH]),
                skybox: filteredEntities.filter(e => e.components[COMPONENTS.SKYBOX] && e.active)[0]?.components[COMPONENTS.SKYBOX],
                directionalLights: filteredEntities.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
                materials: toObject(materials),
                meshSources: toObject(meshes),
                skylight: filteredEntities.filter(e => e.components.SkylightComponent && e.active)[0]?.components[COMPONENTS.SKYLIGHT],
                cubeMaps: filteredEntities.filter(e => e.components.CubeMapComponent),
                scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
                scripts: toObject(scripts),
                cameras: filteredEntities.filter(e => e.components[COMPONENTS.CAMERA])
            }

            const entitiesMap = toObject(entities)
            data.cubeMapsSources = toObject(data.cubeMaps)

            const systems = Object.keys(this._systems).sort()
            this._changed = true
            const cameraTarget = document.getElementById(this.id + '-camera')


            super.start((timestamp) => {
                if (cameraTarget !== null) {
                    const t = this.camera.getNotTranslatedViewMatrix()
                    cameraTarget.style.transform = `translateZ(calc(var(--cubeSize) * -3)) matrix3d(${t})`
                }

                this.camera.updatePlacement()
                this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
                const camera = params.canExecutePhysicsAnimation ? this.rootCamera : this.camera
                for (let s = 0; s < systems.length; s++) {
                    if (!params.canExecutePhysicsAnimation || systems[s] !== SYSTEMS.PICK && params.canExecutePhysicsAnimation)
                        this._systems[systems[s]]
                            .execute(
                                {
                                    ...params,
                                    onGizmoStart,
                                    onGizmoEnd,
                                    lockCamera: (lock) => {
                                        if (lock) {
                                            this.cameraData.cameraEvents.stopTracking()
                                        } else
                                            this.cameraData.cameraEvents.startTracking()
                                    },
                                    entitiesLength: filteredEntities.length,
                                    clicked: this.cameraData.clicked,
                                    setClicked: e => {
                                        this.cameraData.clicked = e
                                    },
                                    dataChanged: this._changed,
                                    setDataChanged: () => {
                                        this._changed = false
                                    },
                                    currentCoords: this.cameraData.currentCoord,
                                    camera: camera,
                                    elapsed: timestamp,
                                    recompile: !this.recompiled,
                                    setRecompile: () => this.recompiled = true
                                },
                                this._systems,
                                data,
                                filteredEntities,
                                this.gizmo,
                                entitiesMap
                            )
                }
            })
        }
    }

    stop() {
        if(this.initialized) {
            this._inExecution = false
            console.log(this.cameraData)
            this.cameraData.cameraEvents.stopTracking()
            cancelAnimationFrame(this._currentFrame)
        }
    }

    get cameraType(){
        return this.cameraData.cameraType
    }
    set cameraType(data){
        this.cameraData.cameraType = data
        this.cameraData.changeCamera(data)
    }
}

function getKey(s) {
    switch (true) {
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
