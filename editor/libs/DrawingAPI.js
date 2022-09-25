export default class DrawingAPI {
    ctx = null
    brushImage = null
    currentImage = null
    callback
    _opacity =  .01
    _intensity = 1

    set opacity(data) {
        const D = this._intensity * 255
        this.ctx.strokeStyle = `rgba(${D}, ${D}, ${D}, ${data * .1})`
        this._opacity = data * .1
    }

    set brushSize(data) {
        this.ctx.lineWidth = data
    }

    set brushIntensity(data) {
        this._intensity = data
        const D = data * 255
        this.ctx.strokeStyle = `rgba(${D}, ${D}, ${D}, ${this._opacity})`
    }

    constructor(canvas, image, callback) {

        if (this.ctx?.canvas === canvas)
            return
        this.callback = callback
        const ctx = canvas.getContext("2d")
        this.currentImage = new Image();


        this.currentImage.onload = () => ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height)

        this.ctx = ctx
        ctx.globalCompositeOperation = "source-over";
        this.ctx.lineJoin = "round"
        this.currentImage.src = image

        this.handlerBound = this.handler.bind(this)

        canvas.addEventListener("mousedown", this.handlerBound)
        document.addEventListener("mouseup", this.handlerBound)
        this.canvas = canvas
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.handlerBound)
        this.canvas.removeEventListener("mousedown", this.handlerBound)
        document.removeEventListener("mouseup", this.handlerBound)
    }

    handler(e) {
        switch (e.type) {
            case "mousedown":
                clearInterval(this.interval)
                this.interval = setInterval(() => this.callback(), 1000)
                this.boundings = this.canvas.getBoundingClientRect()
                this.ctx.beginPath()

                this.X = e.clientX - this.boundings.left;
                this.Y = e.clientY - this.boundings.top;

                this.ctx.moveTo(this.X, this.Y)
                this.canvas.addEventListener("mousemove", this.handlerBound)
                break
            case "mouseup":
                clearInterval(this.interval)
                this.callback()
                this.canvas.removeEventListener("mousemove", this.handlerBound)
                break
            case "mousemove":
                console.log(this)
                const newX = e.clientX - this.boundings.left
                const newY = e.clientY - this.boundings.top
                const ctx = this.ctx

                ctx.lineTo(newX, newY)
                ctx.stroke();

                this.X = newX
                this.Y = newY

                break
            default:
                break
        }
    }
}