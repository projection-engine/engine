export default function blendWithColor() {
    const COLOR_BLEND_OPERATIONS = {ADD: 0, MULTIPLY: 1, POWER: 2, LERP: 3}
    self.addEventListener('message', async (event) => {
        const {
            src,
            color,
            operation
        } = event.data
        const split = color.match(/[\d.]+/g)
        const [r, g, b] = split.map(v => parseFloat(v))

        const res = await fetch(src)
        const blob = await res.blob()
        const imageToLoad = await createImageBitmap(blob)


        self.postMessage(
            await new Promise(resolve => {
                const c = new OffscreenCanvas(imageToLoad.width, imageToLoad.height);
                let ctx = c.getContext("2d");
                ctx.drawImage(imageToLoad, 0, 0)

                const imgData = ctx.getImageData(0, 0, imageToLoad.width, imageToLoad.height);
                const data = imgData.data;
                let newImage = new Array(data.length)
                for (let i = 0; i < data.length; i += 4) {
                    switch (operation) {
                        case COLOR_BLEND_OPERATIONS.POWER:
                            newImage[i] = data[i] ** r
                            newImage[i + 1] = data[i + 1] ** g
                            newImage[i + 2] = data[i + 2] ** b
                            newImage[i + 3] = data[i + 3]
                            break
                        case COLOR_BLEND_OPERATIONS.ADD:
                            newImage[i] = data[i] + r
                            newImage[i + 1] = data[i + 1] + g
                            newImage[i + 2] = data[i + 2] + b
                            newImage[i + 3] = data[i + 3]
                            break
                        default:
                            newImage[i] = data[i] * r
                            newImage[i + 1] = data[i + 1] * g
                            newImage[i + 2] = data[i + 2] * b
                            newImage[i + 3] = data[i + 3]
                            break
                    }
                }
                imgData.data.set(newImage)
                ctx.putImageData(imgData, 0, 0)

                c.convertToBlob({
                    type: "image/png",
                    quality: 1
                }).then(blob => {

                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                })
            })
        )
    })
}

export function colorToImage() {

    self.addEventListener('message', async (event) => {
        const {
            color,
            resolution
        } = event.data

        self.postMessage(
            await new Promise(resolve => {
                const c = new OffscreenCanvas(resolution, resolution);
                let ctx = c.getContext("2d");
                ctx.fillStyle = typeof color === 'string' ? color : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`
                ctx.fillRect(0, 0, resolution, resolution)
                c.convertToBlob({
                    type: "image/png",
                    quality: .1
                }).then(blob => {

                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                })
            })
        )
    })
}

export function linearInterpolate() {

    self.addEventListener('message', async (event) => {
        const {
            img, img0, factor
        } = event.data
        const getBitmap = async (src) => {
            const res = await fetch(src)
            const blob = await res.blob()
            return await createImageBitmap(blob)
        }

        const image1 = await getBitmap(img)
        const image2 = await getBitmap(img0)

        self.postMessage(
            await new Promise(resolve => {
                const canvas1 = new OffscreenCanvas(image1.width, image1.height), ctx1 = canvas1.getContext("2d")
                const canvas2 = new OffscreenCanvas(image2.width, image2.height), ctx2 = canvas2.getContext("2d")
                ctx1.drawImage(image1, 0, 0)
                ctx2.drawImage(image2, 0, 0)

                const data1 = ctx1.getImageData(0, 0, image1.width, image1.height)
                const data2 = ctx2.getImageData(0, 0, image2.width, image2.height)
                const ddata1 = data1.data
                const ddata2 = data2.data
                let newImage = new Uint8Array(ddata1.length)
                for (let i = 0; i < ddata1.length; i += 4) {
                    newImage[i] = ddata1[i] * (1 - factor) + ddata2[i] * factor
                    newImage[i + 1] = ddata1[i + 1] * (1 - factor) + ddata2[i + 1] * factor
                    newImage[i + 2] = ddata1[i + 2] * (1 - factor) + ddata2[i + 2] * factor
                    newImage[i + 3] = ddata1[i + 3] * (1 - factor) + ddata2[i + 3] * factor
                }
                ddata1.set(newImage)

                ctx1.putImageData(data1, 0, 0)

                canvas1.convertToBlob({
                    type: "image/png",
                    quality: 1
                }).then(blob => {

                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                })
            })
        )
    })
}




export function heightBasedLinearInterpolate() {

    self.addEventListener('message', async (event) => {
        const {
            img, img0, heightImg, f
        } = event.data
        const getBitmap = async (src) => {
            const res = await fetch(src)
            const blob = await res.blob()
            return await createImageBitmap(blob)
        }

        const image1 = await getBitmap(img)
        const image2 = await getBitmap(img0)
        const heightMap = await getBitmap(heightImg)

        self.postMessage(
            await new Promise(resolve => {
                const canvas1 = new OffscreenCanvas(image1.width, image1.height), ctx1 = canvas1.getContext("2d")
                const canvas2 = new OffscreenCanvas(image2.width, image2.height), ctx2 = canvas2.getContext("2d")
                const canvasHeight = new OffscreenCanvas(heightMap.width, heightMap.height), ctxHeight = canvasHeight.getContext("2d")

                ctx1.drawImage(image1, 0, 0)
                ctx2.drawImage(image2, 0, 0)

                const data1 = ctx1.getImageData(0, 0, image1.width, image1.height)
                const data2 = ctx2.getImageData(0, 0, image2.width, image2.height)
                const heightMapData = ctxHeight.getImageData(0, 0, heightMap.width, heightMap.height)

                const ddata1 = data1.data
                const ddata2 = data2.data
                const height = heightMapData.data
                const factor = f * 255
                let newImage = new Uint8Array(ddata1.length)
                for (let i = 0; i < ddata1.length; i += 4) {
                    if (factor <= height[i]) {
                        newImage[i] = ddata1[i]
                        newImage[i + 1] = ddata1[i + 1]
                        newImage[i + 2] = ddata1[i + 2]
                        newImage[i + 3] = ddata1[i + 3]
                    } else {
                        newImage[i] = ddata2[i]
                        newImage[i + 1] = ddata2[i + 1]
                        newImage[i + 2] = ddata2[i + 2]
                        newImage[i + 3] = ddata2[i + 3]
                    }

                }

                ddata1.set(newImage)
                ctx1.putImageData(data1, 0, 0)

                canvas1.convertToBlob({
                    type: "image/png",
                    quality: 1
                }).then(blob => {

                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                })
            })
        )
    })
}