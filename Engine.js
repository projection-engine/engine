import TranslationGizmo from "./gizmo/TranslationGizmo";
import perspectiveCameraEvents from "./camera/prespective/perspectiveCameraEvents";
import SphericalCamera from "./camera/prespective/SphericalCamera";
import FreeCamera from "./camera/prespective/FreeCamera";

import {createTexture} from "./utils/utils";
import RenderLoop from "./renderer/RenderLoop";
import brdfImg from '../../static/brdf_lut.jpg'
import OrthographicCamera, {DIRECTIONS} from "./camera/ortho/OrthographicCamera";
import CAMERA_TYPES from "./utils/CAMERA_TYPES";
import OrthographicCameraEvents from "./camera/ortho/OrthographicCameraEvents";

export default class Engine extends RenderLoop {
    types = {}
    cameraType = CAMERA_TYPES.SPHERICAL
    data = {
        fpsTarget: undefined,
        currentCoord: {x: 0, y: 0},

        clicked: false,

        performanceRef: undefined,
        canvasRef: undefined
    }
    utils = {
        postProcessing: undefined,
        translationGizmo: undefined,
    }
    _systems = []
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
        super(id);
        this.data.canvasRef = document.getElementById(id + '-canvas')

        this.gpu = gpu
        this.utils.translationGizmo = new TranslationGizmo(this.gpu)

        const brdf = new Image()
        brdf.src = brdfImg

        brdf.onload = () => {
            this.BRDF = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA32F,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                brdf,
                gpu.LINEAR,
                gpu.LINEAR,
                gpu.CLAMP_TO_EDGE,
                gpu.CLAMP_TO_EDGE
            )
        }

        this.camera = this.sphericalCamera

        this._canvasID = `${id}-canvas`
        this._resetCameraEvents()
    }

    set fov(data) {
        this._fov = data
        this.camera.fov = data
    }

    set systems(data) {
        this.stop()
        if (this.systems.length > data.length) {

            this._systems.map(s => {
                const found = data.find(sis => sis.constructor.name === s.constructor.name)

                if (found)
                    return found
                else
                    return s
            })
        } else
            this._systems = data

    }

    get systems() {
        return this._systems
    }

    _resetCameraEvents() {
        if(this.cameraType === CAMERA_TYPES.SPHERICAL || this.cameraType === CAMERA_TYPES.FREE)
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

    changeCamera() {
        this.cameraEvents.stopTracking()
        let cameraToApply

        switch (this.cameraType){
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

    start(entities) {
        this.cameraEvents.startTracking()
        this.gpu?.cullFace(this.gpu.BACK)


        super.start((timestamp) => {
            this.camera.updatePlacement()
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            this._systems.forEach((s, i) => {
                s.execute(
                    entities,
                    {
                        ...this.params,
                        clicked: this.data.clicked,
                        setClicked: e => {
                            this.data.clicked = e
                        },
                        currentCoords: this.data.currentCoord,
                        camera: this.camera,
                        elapsed: timestamp,
                        BRDF: this.BRDF
                    },
                    this._systems,
                    this.types
                )
            })
        })
    }

    stop() {
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this._currentFrame)
    }

    prepareData(params, entities, materials, meshes) {
        let r = {
            pointLights: {},
            spotLights: {},
            meshes: {},
            skyboxes: {},
            grid: {},
            directionalLights: {},
            materials: {},
            meshSources: {},
            cubeMaps: {},

            staticPhysicsMeshes: {},
            dynamicPhysicsMeshes: {}
        }

        for (let i = 0; i < entities.length; i++) {
            const current = entities[i]
            if (current.components.PointLightComponent)
                r.pointLights[current.id] = i
            if (current.components.SpotLightComponent)
                r.spotLights[current.id] = i
            if (current.components.DirectionalLightComponent)
                r.directionalLights[current.id] = i

            if (current.components.SkyboxComponent)
                r.skyboxes[current.id] = i
            if (current.components.GridComponent)
                r.grid[current.id] = i
            if (current.components.MeshComponent) {
                r.meshes[current.id] = i
                if (!current.components.PhysicsComponent && current.components.SphereCollider)
                    r.staticPhysicsMeshes[current.id] = i
                else if (current.components.PhysicsComponent && current.components.SphereCollider)
                    r.dynamicPhysicsMeshes[current.id] = i
            }
            if (current.components.CubeMapComponent)
                r.cubeMaps[current.id] = i

        }
        for (let i = 0; i < materials.length; i++) {
            r.materials[materials[i].id] = i
        }

        for (let i = 0; i < meshes.length; i++) {

            r.meshSources[meshes[i].id] = i
        }


        this.types = r
        if (params.cameraType && params.cameraType !== this.cameraType) {
            this.cameraType = params.cameraType
            this.changeCamera()
        }
        this.params = params
        this.cameraEvents.stopTracking()
    }

}