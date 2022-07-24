import {v4} from "uuid"
import imageWorker from "../../../../web-workers/image-worker"

export default function windowBuilder(canvas) {
    const ctx = canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
    })
    ctx.getExtension("EXT_color_buffer_float")
    ctx.getExtension("OES_texture_float")
    ctx.getExtension("OES_texture_float_linear")
    ctx.enable(ctx.BLEND)
    ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA)
    ctx.enable(ctx.CULL_FACE)
    ctx.cullFace(ctx.BACK)
    ctx.enable(ctx.DEPTH_TEST)
    ctx.depthFunc(ctx.LESS)
    ctx.frontFace(ctx.CCW)


    let worker =  imageWorker()

    const callbacks = []
    const doWork = (type, data, callback) => {
        const id = v4()
        callbacks.push({
            callback,
            id
        })

        worker.postMessage({data, type, id})
    }
    worker.onmessage = ({data: {data, id}}) => {
        const callback = callbacks.find(c => c.id === id)

        if (callback)
            callback.callback(data)
    }
    window.gpu = ctx
    window.imageWorker = (type, data) => {
        return new Promise(resolve => doWork(type, data, (res) => resolve(res)))
    }

}