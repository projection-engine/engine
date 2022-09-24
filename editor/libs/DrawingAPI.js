export default class DrawingAPI {
    ctx = null
    brushImage = null
    currentImage = null
    callback
    brushColor = "#555"
    brushSize = 10

    set brushFalloff(data) {
        const ctx = this.ctx
        const gradient = ctx.createLinearGradient(0, 0, this.brushSize / 2, this.brushSize / 2)
        gradient.addColorStop(0, "White");
        gradient.addColorStop(0.3, "rgba(128, 128, 256, .5)");
        gradient.addColorStop(0.4, "rgba(128, 128, 256, .5)");
        gradient.addColorStop(1, "White");
        ctx.strokeStyle = gradient

    }

    constructor(canvas, image, callback) {

        if (this.ctx?.canvas === canvas)
            return
        this.callback = callback
        const ctx = canvas.getContext("2d")
        this.currentImage = new Image();


        this.currentImage.onload = () => {
            ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height)
            ctx.strokeStyle = this.brushColor
            this.brushFalloff = .3
        }
        this.ctx = ctx
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
                this.X = e.clientX - this.boundings.left;
                this.Y = e.clientY - this.boundings.top;
                this.canvas.addEventListener("mousemove", this.handlerBound)
                break
            case "mouseup":
                clearInterval(this.interval)
                this.callback()
                this.canvas.removeEventListener("mousemove", this.handlerBound)
                break
            case "mousemove":
                const newX = e.clientX - this.boundings.left
                const newY = e.clientY - this.boundings.top
                const ctx = this.ctx

                const gradient = ctx.createRadialGradient(newX, newY, this.brushSize / 2, newX, newY, this.brushSize);

                gradient.addColorStop(1, 'white');
                gradient.addColorStop(0, 'rgba(255, 0,0,.2)');

                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(newX, newY, this.brushSize, 0, Math.PI * 2);
                ctx.fill();

                this.X = newX
                this.Y = newY

                break
            default:
                break
        }
    }
}