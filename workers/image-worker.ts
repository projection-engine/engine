import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";

self.onmessage = async ({data: {type, data, id}}) => {
    try {
        switch (type) {
            case IMAGE_WORKER_ACTIONS.RESIZE_IMAGE: {
                const {image, width, height, sizePercent, quality} = data
                const imageToLoad = await createImageBitmap(await (await fetch(image)).blob())
                const widthF = width ? width : sizePercent ? imageToLoad.width * sizePercent : imageToLoad.width
                const heightF = height ? height : sizePercent ? imageToLoad.height * sizePercent : imageToLoad.height
                if (widthF === 0 || heightF === 0)
                    self.postMessage(undefined)
                if (imageToLoad.width === widthF && imageToLoad.height === heightF)
                    self.postMessage(image)

                else {
                    const canvas = new OffscreenCanvas(widthF, heightF),
                        ctx = canvas.getContext("2d")

                    // @ts-ignore
                    ctx.drawImage(imageToLoad, 0, 0, widthF, heightF)
                    // @ts-ignore
                    const canvasBlob = await canvas.convertToBlob({
                        type: "image/png",
                        quality: quality
                    })
                    const reader = new FileReader()
                    reader.readAsDataURL(canvasBlob)
                    reader.onloadend = () => self.postMessage({data: reader.result, id})
                }
                break
            }
            case IMAGE_WORKER_ACTIONS.COLOR_TO_IMAGE: {
                const {
                    color,
                    resolution
                } = data
                const c = new OffscreenCanvas(resolution, resolution)
                let ctx = c.getContext("2d")
                // @ts-ignore
                ctx.fillStyle = typeof color === "string" ? color : "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")"
                // @ts-ignore
                ctx.fillRect(0, 0, resolution, resolution)
                // @ts-ignore
                const canvasBlob = await c.convertToBlob({
                    type: "image/png",
                    quality: .1
                })
                const reader = new FileReader()
                reader.onloadend = () => self.postMessage({data: reader.result, id})
                reader.readAsDataURL(canvasBlob)

                break
            }
            case IMAGE_WORKER_ACTIONS.IMAGE_BITMAP: {
                const {base64, onlyData} = data
                const b = onlyData ? base64 : base64.split(";base64,")[1]
                const buffer = Buffer.from(b, "base64")
                const blob = new Blob([buffer], {type: "base64"})
                const bitmap = await createImageBitmap(blob)
                self.postMessage({data: bitmap, id})
                break
            }
            case IMAGE_WORKER_ACTIONS.NOISE_DATA: {
                const {w, h} = data

                const KERNEL_SIZE = 64
                const kernels = new Float32Array(new ArrayBuffer( KERNEL_SIZE * 4 * 4))
                let offset = 0
                for (let i = 0; i < KERNEL_SIZE; i++) {
                    const scale = i / KERNEL_SIZE
                    const m = .1 + .9 * (scale ** 2)

                    const v = new Float32Array(12)
                    v[0] = (2.0 * Math.random() - 1.0)
                    v[1] = (2.0 * Math.random() - 1.0)
                    v[2] = Math.random()

                    let x = v[0];
                    let y = v[1];
                    let z = v[2];
                    let len = x * x + y * y + z * z;
                    if (len > 0)
                        len = 1 / Math.sqrt(len);

                    kernels[offset] = v[0] * len * m;
                    kernels[offset + 1] = v[1] * len * m;
                    kernels[offset + 2] = v[2] * len * m;
                    kernels[offset + 3] = 0
                    offset += 4
                }

                let p = w * h
                const noiseTextureData = new Float32Array(p * 3)

                for (let i = 0; i < p; ++i) {
                    let index = i * 2
                    noiseTextureData[index] = Math.random() * 2.0 - 1.0
                    noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0
                    noiseTextureData[index + 2] = 0
                }

                self.postMessage(
                    {
                        data: {
                            noise: noiseTextureData,
                            kernels
                        }, id
                        // @ts-ignore
                    }, [noiseTextureData.buffer, kernels.buffer])
                break
            }
            default:
                self.postMessage({data: null, id})
                break
        }
        return
    } catch (error) {
        console.error(error)
        self.postMessage({data: null, id})
    }
}