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

export function normalMatrix(matrix){
    var a00 = matrix[0], a01 = matrix[1], a02 = matrix[2], a03 = matrix[3],
        a10 = matrix[4], a11 = matrix[5], a12 = matrix[6], a13 = matrix[7],
        a20 = matrix[8], a21 = matrix[9], a22 = matrix[10], a23 = matrix[11],
        a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    var result = []

    result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    result[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    result[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    result[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    result[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    result[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    result[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    result[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    result[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return result;
}


export function multiplyMatrices (a, b) {

    var result = [];

    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    result[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    result[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    result[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    result[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    result[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    result[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    result[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    return result;
}