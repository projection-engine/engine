import {PickingAPI} from "../../../production";
import TerrainWorker from "../../../production/workers/terrain/TerrainWorker";

const MOUSE_LEFT = 0
export default class SculptingGizmo {
    ctx = null
    brushImage = null
    currentImage = null
    callback

    updateMesh = () => null

    constructor(image) {
        const canvas = document.createElement("canvas")

        this.ctx = canvas.getContext("2d")
        this.ctx.lineJoin = "round"
        this.ctx.strokeStyle = "rgb(255, 0, 0)"

        this.currentImage = new Image();
        this.currentImage.onload = () => {
            canvas.width = this.currentImage.naturalWidth
            canvas.height = this.currentImage.naturalHeight
            this.ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height)
        }
        this.currentImage.src = image

        this.handlerBound = this.handler.bind(this)

        gpu.canvas.addEventListener("mousedown", this.handlerBound)
        document.addEventListener("mouseup", this.handlerBound)
        this.canvas = canvas
    }

    destroy() {
        document.removeEventListener("mousemove", this.handlerBound)
        gpu.canvas.removeEventListener("mousedown", this.handlerBound)
        document.removeEventListener("mouseup", this.handlerBound)
    }

    handler(e) {
        switch (e.type) {
            case "mousedown": {
                if (e.button !== MOUSE_LEFT || e.target !== gpu.canvas)
                    return
                clearInterval(this.interval)
                this.interval = setInterval(() => this.updateMesh(), 300)
                this.ctx.beginPath()
                const {texCoords} = PickingAPI.readUV(e.clientX, e.clientY, this.currentImage.naturalWidth, this.currentImage.naturalHeight)
                this.ctx.moveTo(texCoords.x, texCoords.y)
                document.addEventListener("mousemove", this.handlerBound)
                this.wasDown = true
                break
            }
            case "mouseup":
                if (this.wasDown) {
                    clearInterval(this.interval)
                    this.wasDown = false
                    this.updateMesh()
                    document.removeEventListener("mousemove", this.handlerBound)
                }
                break
            case "mousemove": {
                const ctx = this.ctx
                const {texCoords} = PickingAPI.readUV(e.clientX, e.clientY, this.currentImage.naturalWidth, this.currentImage.naturalHeight)
                ctx.lineTo(texCoords.x, texCoords.y)
                ctx.stroke();

                break
            }
            default:
                break
        }
    }
}