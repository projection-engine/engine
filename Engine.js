
import perspectiveCameraEvents from "./utils/camera/prespective/perspectiveCameraEvents";
import SphericalCamera from "./utils/camera/prespective/SphericalCamera";
import FreeCamera from "./utils/camera/prespective/FreeCamera";

import {createTexture} from "./utils/misc/utils";
import RenderLoop from "./utils/workers/RenderLoop";
import brdfImg from '../../static/brdf_lut.jpg'
import OrthographicCamera, {DIRECTIONS} from "./utils/camera/ortho/OrthographicCamera";
import CAMERA_TYPES from "./utils/camera/CAMERA_TYPES";
import OrthographicCameraEvents from "./utils/camera/ortho/OrthographicCameraEvents";
import toObject from "./utils/misc/toObject";

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
        super();
        this.data.canvasRef = document.getElementById(id + '-canvas')
        this.gpu = gpu
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

    start(entities, materials, meshes, params) {
        this.cameraEvents.startTracking()
        this.gpu?.cullFace(this.gpu.BACK)

        const filteredEntities = entities.filter(e => e.active)
        const data = {
            pointLights: filteredEntities.filter(e => e.components.PointLightComponent),
            spotLights: filteredEntities.filter(e => e.components.SpotLightComponent),
            terrains: filteredEntities.filter(e => e.components.TerrainComponent),
            meshes: filteredEntities.filter(e => e.components.MeshComponent),
            skybox: filteredEntities.filter(e => e.components.SkyboxComponent && e.active)[0],
            directionalLights: filteredEntities.filter(e => e.components.DirectionalLightComponent),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            cubeMaps: filteredEntities.filter(e => e.components.CubeMapComponent)
        }
        super.start((timestamp) => {
            this.camera.updatePlacement()
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            this._systems.forEach((s, i) => {
                s.execute(
                    {
                        ...params,
                        entitiesLength: entities.length,
                        clicked: this.data.clicked,
                        setClicked: e => {
                            this.data.clicked = e
                        },
                        currentCoords: this.data.currentCoord,
                        camera: this.camera,
                        elapsed: timestamp,
                    },
                    this._systems,
                    data
                )
            })
        })
    }

    stop() {
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this._currentFrame)
    }

    updateCamera(cameraType) {
        this.cameraType = cameraType
        this.changeCamera(cameraType)
    }

}
