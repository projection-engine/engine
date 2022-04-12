import CAMERA_TYPES from "./templates/CAMERA_TYPES";
import SphericalCamera from "./utils/camera/prespective/SphericalCamera";
import FreeCamera from "./utils/camera/prespective/FreeCamera";
import OrthographicCamera, {DIRECTIONS} from "./utils/camera/ortho/OrthographicCamera";
import perspectiveCameraEvents from "./utils/camera/prespective/perspectiveCameraEvents";
import OrthographicCameraEvents from "./utils/camera/ortho/OrthographicCameraEvents";

export default class EditorCameras{
    currentCoord = {x: 0, y: 0}
    clicked = false

    sphericalCamera = new SphericalCamera([0, 10, 30], 1.57, .1, 10000, 1)
    freeCamera = new FreeCamera([0, 10, 30], 1.57, .1, 10000, 1)
    topCamera = new OrthographicCamera(1, DIRECTIONS.TOP)
    bottomCamera = new OrthographicCamera(1, DIRECTIONS.BOTTOM)
    leftCamera = new OrthographicCamera(1, DIRECTIONS.LEFT)
    rightCamera = new OrthographicCamera(1, DIRECTIONS.RIGHT)
    frontCamera = new OrthographicCamera(1, DIRECTIONS.FRONT)
    backCamera = new OrthographicCamera(1, DIRECTIONS.BACK)
    onClick = () => null
    constructor(id, cameraType, canvasRef) {
        this.camera = this.sphericalCamera
        this.id = id
        this.canvasID = canvasRef.id
        this.canvasRef = canvasRef

        this.cameraType = cameraType

        this._resetCameraEvents()
    }

    _resetCameraEvents() {
        if (this.cameraType === CAMERA_TYPES.SPHERICAL || this.cameraType === CAMERA_TYPES.FREE)
            this.cameraEvents = new perspectiveCameraEvents(
                this.camera,
                this.canvasID,
                (x, y) => this.onClick({x, y}))
        else
            this.cameraEvents = new OrthographicCameraEvents(
                this.camera,
                this.canvasID,
                (x, y) => this.onClick({x, y}))
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
        const bBox = this.canvasRef.getBoundingClientRect()
        cameraToApply.aspectRatio = bBox.width / bBox.height

        this.camera = cameraToApply
        this._resetCameraEvents()

        this.cameraEvents.startTracking()
    }

}