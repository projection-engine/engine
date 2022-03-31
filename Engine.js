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

export default class Engine extends RenderLoop {
    types = {}
    gizmo
    cameraType = CAMERA_TYPES.SPHERICAL
    recompiled = false
    data = {
        fpsTarget: undefined,
        currentCoord: {x: 0, y: 0},

        clicked: false,

        performanceRef: undefined,
        canvasRef: undefined
    }

    _systems = {}
    _fov = Math.PI / 2

    sphericalCamera = new SphericalCamera([0, 10, 30], 1.57, .1, 10000, 1)
    freeCamera = new FreeCamera([0, 10, 30], 1.57, .1, 10000, 1)

    topCamera = new OrthographicCamera(
        1,
        DIRECTIONS.TOP
    )
    bottomCamera = new OrthographicCamera(
        1,
        DIRECTIONS.BOTTOM
    )
    leftCamera = new OrthographicCamera(
        1,
        DIRECTIONS.LEFT
    )
    rightCamera = new OrthographicCamera(
        1,
        DIRECTIONS.RIGHT
    )
    frontCamera = new OrthographicCamera(
        1,
        DIRECTIONS.FRONT
    )
    backCamera = new OrthographicCamera(
        1,
        DIRECTIONS.BACK
    )

    constructor(id, gpu) {
        super();
        this.id = id
        this.data.canvasRef = document.getElementById(id + '-canvas')
        this.gpu = gpu
        this.camera = this.sphericalCamera
        this._canvasID = `${id}-canvas`
        this._resetCameraEvents()
    }

    get canvas() {
        return this.gpu.canvas
    }

    set fov(data) {
        this._fov = data
        this.camera.fov = data
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

    _resetCameraEvents() {
        if (this.cameraType === CAMERA_TYPES.SPHERICAL || this.cameraType === CAMERA_TYPES.FREE)
            this.cameraEvents = new perspectiveCameraEvents(
                this.camera,
                this._canvasID,
                (x, y) => {
                    this.data.clicked = true
                    this.data.currentCoord = {x, y}
                })
        else
            this.cameraEvents = new OrthographicCameraEvents(
                this.camera,
                this._canvasID,
                (x, y) => {
                    this.data.clicked = true
                    this.data.currentCoord = {x, y}
                })
    }

    changeCamera(newType) {
        this.cameraEvents.stopTracking()
        let cameraToApply

        switch (newType) {
            case CAMERA_TYPES.BOTTOM:
                cameraToApply = this.bottomCamera
                break
            case CAMERA_TYPES.TOP:
                cameraToApply = this.topCamera
                break
            case CAMERA_TYPES.FRONT:
                cameraToApply = this.frontCamera
                break
            case CAMERA_TYPES.BACK:
                cameraToApply = this.backCamera
                break
            case CAMERA_TYPES.LEFT:
                cameraToApply = this.leftCamera
                break
            case CAMERA_TYPES.RIGHT:
                cameraToApply = this.rightCamera
                break
            case CAMERA_TYPES.FREE:
                cameraToApply = this.freeCamera
                break
            default:
                cameraToApply = this.sphericalCamera
                break
        }
        cameraToApply.aspectRatio = this.gpu.canvas.width / this.gpu.canvas.height

        this.camera = cameraToApply
        this._resetCameraEvents()

        this.cameraEvents.startTracking()
    }

    start(entities, materials, meshes, params, scripts=[]) {
        if (!this._inExecution) {
            this._inExecution = true
            this.cameraEvents.startTracking()
            const filteredEntities = (params.canExecutePhysicsAnimation ? entities.map(e => cloneClass(e)) : entities).filter(e => e.active)
            const data = {
                pointLights: filteredEntities.filter(e => e.components.PointLightComponent),
                spotLights: filteredEntities.filter(e => e.components.SpotLightComponent),
                terrains: filteredEntities.filter(e => e.components.TerrainComponent),
                translucentMeshes: toObject(filteredEntities.filter(e => {
                    if (e.components.MaterialComponent) {
                        const material = materials.find(m => m.id === e.components.MaterialComponent.materialID)
                        return material && material.type === MATERIAL_TYPES.TRANSPARENT
                    } else
                        return false
                })),
                meshes: filteredEntities.filter(e => e.components.MeshComponent),
                skybox: filteredEntities.filter(e => e.components.SkyboxComponent && e.active)[0]?.components.SkyboxComponent,
                directionalLights: filteredEntities.filter(e => e.components.DirectionalLightComponent),
                materials: toObject(materials),
                meshSources: toObject(meshes),
                skylight: filteredEntities.filter(e => e.components.SkylightComponent && e.active)[0]?.components?.SkylightComponent,
                cubeMaps: filteredEntities.filter(e => e.components.CubeMapComponent),
                scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
                scripts: toObject(scripts),
                cameras: filteredEntities.filter(e => e.components[COMPONENTS.CAMERA])
            }


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
                for (let s = 0; s < systems.length; s++) {

                    this._systems[systems[s]]
                        .execute(
                            {
                                ...params,
                                onGizmoChange: params.onGizmoChange ? params.onGizmoChange : () => null,
                                lockCamera: (lock) => {
                                    if (lock) {
                                        this.cameraEvents.stopTracking()
                                    } else
                                        this.cameraEvents.startTracking()
                                },
                                entitiesLength: filteredEntities.length,
                                clicked: this.data.clicked,
                                setClicked: e => {
                                    this.data.clicked = e
                                },
                                dataChanged: this._changed,
                                setDataChanged: () => {
                                    this._changed = false
                                },
                                currentCoords: this.data.currentCoord,
                                camera: this.camera,
                                elapsed: timestamp,
                                recompile: !this.recompiled,
                                setRecompile: () => this.recompiled = true
                            },
                            this._systems,
                            data,
                            filteredEntities,
                            this.gizmo
                        )
                }
            })
        }
    }

    stop() {
        this._inExecution = false
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this._currentFrame)
    }

    updateCamera(cameraType) {
        this.cameraType = cameraType
        this.changeCamera(cameraType)
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
