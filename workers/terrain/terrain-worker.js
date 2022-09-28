import PrimitiveProcessor from "../../production/apis/PrimitiveProcessor";


function sampleTexture(x, y, buffer, heightScale, canvasSize) {
    const r = buffer[y * (canvasSize * 4) + x * 4]

    let height = (r / 255)
    return height * heightScale
}

async function buildTerrain(base64, scale, dimension) {
    const fetchData = await fetch(base64)
    const blob = await fetchData.blob()
    const imageToLoad = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(imageToLoad.width, imageToLoad.height), ctx = canvas.getContext("2d")
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(imageToLoad, 0, 0, imageToLoad.width, imageToLoad.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const vertexCount = imageToLoad.width
    const count = vertexCount ** 2

    let vertices = new Float32Array(count * 3),
        uvs = new Float32Array(count * 2),
        indices = new Float32Array(6 * (vertexCount - 1) * vertexCount),
        vertexPointer = 0

    const OFFSET = dimension/2

    for (let i = 0; i < vertexCount; i++) {
        for (let j = 0; j < vertexCount; j++) {
            vertices[vertexPointer * 3] = (j / (vertexCount - 1)) * dimension - OFFSET
            vertices[vertexPointer * 3 + 1] = sampleTexture(j, i, imageData, scale, canvas.width)
            vertices[vertexPointer * 3 + 2] = (i / (vertexCount - 1)) * dimension - OFFSET

            uvs[vertexPointer * 2] = j / (vertexCount - 1)
            uvs[vertexPointer * 2 + 1] = i / (vertexCount - 1)
            vertexPointer++
        }
    }


    let pointer = 0
    for (let gz = 0; gz < vertexCount - 1; gz++) {
        for (let gx = 0; gx < vertexCount - 1; gx++) {
            const topLeft = (gz * vertexCount) + gx,
                topRight = topLeft + 1,
                bottomLeft = ((gz + 1) * vertexCount) + gx,
                bottomRight = bottomLeft + 1


            indices[pointer++] = topLeft
            indices[pointer++] = bottomLeft
            indices[pointer++] = topRight
            indices[pointer++] = topRight
            indices[pointer++] = bottomLeft
            indices[pointer++] = bottomRight
        }
    }
    const normals = PrimitiveProcessor.computeNormals(indices, vertices)

    const tangents = PrimitiveProcessor.computeTangents(indices, vertices, uvs, normals)
    console.log(tangents)

    const builtNormals = Float32Array.from(normals)
    const builtTangents = Float32Array.from(tangents)

    return [
        {
            vertices,
            uvs,
            normals: builtNormals,
            indices,
            tangents: builtTangents
        },
        [vertices.buffer, uvs.buffer, indices.buffer, builtNormals.buffer, builtTangents.buffer]
    ]

}

self.onmessage = event => {
    const {base64, scale, dimensions} = event.data
    buildTerrain(base64, scale, dimensions).then(data => {
        console.log(data)
        self.postMessage(data[0], data[1])
    })
}