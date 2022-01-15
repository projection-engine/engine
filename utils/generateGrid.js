export default function generateGrid(iterations, size) {
    let numVerticesWidth = iterations + 1;
    let numVerticesHeight = iterations + 1;

    let vertices = []

    let posX, posZ
    let startX = -iterations * size / 2;
    let startY = iterations * size / 2;

    for (let z = 0; z < numVerticesHeight; z++) {
        for (let x = 0; x < numVerticesWidth; x++) {
            posX = startX + x * size
            posZ = startY - z * size

            vertices.push(posX, 0, posZ);
        }
    }
    let indices = []
    for (let y = 0; y < numVerticesHeight - 1; y++) {
        for (let x = 0; x < numVerticesWidth - 1; x++) {
            let lu = (x + (y * (numVerticesWidth)));
            let ru = ((x + 1) + (y * (numVerticesWidth)));
            let rb = ((x + 1) + ((y + 1) * (numVerticesWidth)));
            let lb = (x + ((y + 1) * (numVerticesWidth)));

            indices.push(lu)
            indices.push(ru)
            indices.push(lb)

            indices.push(ru)
            indices.push(rb)
            indices.push(lb)
        }
    }
    return {
        vertices: vertices,
        indices: indices
    }
}