import TranslationGizmo from "./gizmo/TranslationGizmo";
import cameraEvents from "./camera/cameraEvents";
import SphericalCamera from "./camera/SphericalCamera";
import FreeCamera from "./camera/FreeCamera";

import {createTexture} from "./utils/utils";
import RenderLoop from "./renderer/RenderLoop";

export default class Engine extends RenderLoop{
    types = {}
    cameraType = 'spherical'
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


    constructor(id, gpu, fpsTarget) {
        super(id);
        this.data.canvasRef = document.getElementById(id + '-canvas')
        this.data.fpsTarget = fpsTarget
        this.gpu = gpu
        this.utils.translationGizmo = new TranslationGizmo(this.gpu)

        const brdf = new Image()
        brdf.src = './brdf_lut.jpg'

        brdf.onload =() => {
            this.BRDF = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA16F,
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

        this.camera = new SphericalCamera([0, 10, 30], 1.57, 1, 2000, 1)

        this._canvasID = `${id}-canvas`
        this._resetCameraEvents()
    }

    _resetCameraEvents() {
        this.cameraEvents = cameraEvents(
            this.camera,
            this._canvasID,
            (x, y) => {
                this.data.clicked = true
                this.data.currentCoord = {x, y}
            })
    }

    changeCamera() {
        this.cameraEvents.stopTracking()

        if (this.camera instanceof SphericalCamera) {

            this.camera = this.backupSpherical ? this.backupSpherical : new FreeCamera([0, 10, 30], 1.57, 1, 2000, 1)
            this.backupSpherical = this.camera
        } else {
            this.camera = this.backupFree ? this.backupFree : new SphericalCamera([0, 10, 30], 1.57, 1, 2000, 1)
            this.backupFree = this.camera
        }
        this._resetCameraEvents()

        this.cameraEvents.startTracking()
    }

    start(entities, systems) {
        this.keep = true
        this.cameraEvents.startTracking()

        super.start((timestamp) => {
            this.camera.updatePlacement()
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            systems.forEach((s, i) => {
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
                    systems,
                    this.types
                )
            })
        })
    }

    stop() {
        this.keep = false
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this._currentFrame)
    }
}