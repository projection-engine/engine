export default function resize() {
    self.addEventListener("message", (event) => {
        const {
            src, w, h, sizePercent, quality
        } = event.data
        fetch(src)
            .then(res => {
                res.blob()
                    .then(blob => {
                        createImageBitmap(blob)
                            .then(imageToLoad => {
                                const width = w ? w : sizePercent ? imageToLoad.width * sizePercent : imageToLoad.width
                                const height = h ? h : sizePercent ? imageToLoad.height * sizePercent : imageToLoad.height
                                if (width === 0 || height === 0)
                                    self.postMessage(undefined)
                                if (imageToLoad.width === width && imageToLoad.height === height)
                                    self.postMessage(src)

                                else {
                                    const canvas = new OffscreenCanvas(width, height),
                                        ctx = canvas.getContext("2d")
                                    ctx.drawImage(imageToLoad, 0, 0, width, height)
                                    canvas.convertToBlob({
                                        type: "image/png",
                                        quality: quality
                                    }).then(b => {
                                        const reader = new FileReader()
                                        reader.readAsDataURL(b)
                                        reader.onloadend = () => self.postMessage(reader.result)
                                    })
                                }
                            })
                    })
            })
    })
}

export function getImageBitmap() {
    const doIt = (event) => {
        fetch(event.data)
            .then(res => {
                res.blob().then(blob => {
                    createImageBitmap(blob)
                        .then(result => self.postMessage(result))
                })
            })
    }
    self.addEventListener("message", (event) => doIt(event))
}

export function extractChannel() {
    self.addEventListener("message", (event) => {
        new Promise(async resolve => {
            const {
                channels,
                img
            } = event.data
            const [r, g, b, a] = channels
            const res = await fetch(img)
            const blob = await res.blob()
            const imageToLoad = await createImageBitmap(blob)

            self.postMessage(
                await new Promise(resolve => {
                    const c = new OffscreenCanvas(imageToLoad.width, imageToLoad.height)
                    let ctx = c.getContext("2d")
                    ctx.drawImage(imageToLoad, 0, 0)

                    const imgData = ctx.getImageData(0, 0, imageToLoad.width, imageToLoad.height)
                    const data = imgData.data

                    let newImage = new Uint8Array(data.length)

                    for (let i = 0; i < data.length; i += 4) {

                        newImage[i] = data[i] * r
                        newImage[i + 1] = data[i + 1] * g
                        newImage[i + 2] = data[i + 2] * b
                        newImage[i + 3] = data[i + 3] * a
                    }
                    imgData.data.set(newImage)
                    ctx.putImageData(imgData, 0, 0)

                    c.convertToBlob({
                        type: "image/png",
                        quality: 1
                    }).then(blob => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result)
                        reader.readAsDataURL(blob)
                    })
                })
            )
            resolve()
        }).catch()
    })
}


export function invert() {
    self.addEventListener("message", (event) => {
        new Promise(async resolve => {
            const {
                img
            } = event.data

            const res = await fetch(img)
            const blob = await res.blob()
            const imageToLoad = await createImageBitmap(blob)

            self.postMessage(
                await new Promise(resolve => {
                    const c = new OffscreenCanvas(imageToLoad.width, imageToLoad.height)
                    let ctx = c.getContext("2d")
                    ctx.drawImage(imageToLoad, 0, 0)
                    ctx.globalCompositeOperation = "difference"
                    ctx.fillStyle = "white"
                    ctx.fillRect(0, 0, imageToLoad.width, imageToLoad.height)


                    c.convertToBlob({
                        type: "image/png",
                        quality: 1
                    }).then(blob => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result)
                        reader.readAsDataURL(blob)
                    })
                })
            )
            resolve()
        }).catch()
    })
}