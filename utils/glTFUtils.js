import {WebWorker} from "../../workers/WebWorker";

export function nodeParser(node, allNodes) {
    let res = []
    let children = node.children && node.children.length > 0 ? allNodes
            .map((n, index) => {
                if (node.children.includes(index))
                    return {...allNodes[index], index}
                else
                    return undefined
            }).filter(e => e !== undefined)
        :
        []
    children = children
        .map(child => {
            return nodeParser(child, allNodes, true)
        })
        .flat()
    let parsedNode = {
        name: node.name,
        meshIndex: node.mesh,
        scaling: [1, 1, 1],
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
        children: []
    }

    if (node.matrix) {
        parsedNode = {
            ...parsedNode,
            ...extractTransformations(node.matrix)
        }
    } else {
        let translation = node.translation,
            rotation = node.rotation,
            scale = node.scale
        if (!translation)
            translation = [0, 0, 0]
        if (!scale)
            scale = [1, 1, 1]
        if (!rotation)
            rotation = [0, 0, 0, 1]


        let rotationMatrix = new Array(16).fill(0)
        rotationMatrix[0] *= 1 - 2 * (rotation[1] ** 2) - 2 * (rotation[2] ** 2) // times
        rotationMatrix[1] = 2 * rotation[0] * rotation[1] - 2 * rotation[3] * rotation[2] // 2xy - 2sz
        rotationMatrix[2] = 2 * rotation[0] * rotation[2] + 2 * rotation[3] * rotation[1] // 2xz + 2sy

        rotationMatrix[4] = 2 * rotation[0] * rotation[1] + 2 * rotation[3] * rotation[2] // 2xy + 2sz
        rotationMatrix[5] *= 1 - 2 * (rotation[0] ** 2) - 2 * (rotation[2] ** 2) // 1 - 2x^2 - 2z^2
        rotationMatrix[6] = 2 * rotation[1] * rotation[2] - 2 * rotation[3] * rotation[0] // 2yz - 2sx

        rotationMatrix[8] = 2 * rotation[0] * rotation[2] - 2 * rotation[3] * rotation[1] // 2xz - 2sy
        rotationMatrix[9] = 2 * rotation[1] * rotation[2] + 2 * rotation[3] * rotation[0] // 2yz + 2sx
        rotationMatrix[10] *= 1 - 2 * (rotation[0] ** 2) - 2 * (rotation[1] ** 2) // 1 - 2x^2 - 2y^2
        rotationMatrix[15] = 1


        parsedNode.scaling = scale
        parsedNode.rotation = rotationToEulerAngles(rotationMatrix)
        parsedNode.translation = translation

    }

    res.push(...children)
    if (node.mesh !== undefined)
        res.push(parsedNode)
    return res
}


function extractTransformations(mat) {
    let s, r, t
    t = {xT: mat[12], yT: mat[13], zT: mat[14]}
    let sX = Math.sqrt((mat[0] ** 2 + mat[4] ** 2 + mat[8] ** 2)),
        sY = Math.sqrt((mat[1] ** 2 + mat[5] ** 2 + mat[9] ** 2)),
        sZ = Math.sqrt((mat[2] ** 2 + mat[6] ** 2 + mat[10] ** 2))
    s = {xS: sX, yS: sY, zS: sZ}

    r = [
        mat[0] / sX, mat[1] / sY, mat[2] / sZ, 0,
        mat[4] / sX, mat[5] / sY, mat[6] / sZ, 0,
        mat[8] / sX, mat[9] / sY, mat[10] / sZ, 0,
        0, 0, 0, 1
    ]
    r = rotationToEulerAngles(r)

    return {
        translation: t,
        rotation: r,
        scaling: s
    }
}

function rotationToEulerAngles(mat) {
    return [Math.atan2(mat[9], mat[10]), Math.atan2(-mat[8], Math.sqrt(mat[9] ** 2 + mat[10] ** 2)), Math.atan2(mat[4], mat[0])]

}


export function getPrimitives(mesh, accessors, materials = []) {
    const primitives = mesh.primitives;

    primitives.forEach(primitive => {
        primitive.attributes = Object.keys(primitive.attributes).map(name => ({
            name,
            index: primitive.attributes[name]
        }))

        if (typeof primitive.material !== "undefined") {
            primitive.material = materials[primitive.material];
        }
    });
    return primitives.map(p => {
        const vert = p.attributes.find(d => d.name === 'POSITION')
        const norm = p.attributes.find(d => d.name === 'NORMAL')
        const tang = p.attributes.find(d => d.name === 'TANGENT')
        const uv = p.attributes.find(d => d.name === 'TEXCOORD_0')


        return {
            indices: accessors[p.indices]?.data,
            vertices: vert ? accessors[vert.index]?.data : [],
            tangents: tang ? accessors[tang.index]?.data : [],
            normals: norm ? accessors[norm.index]?.data : [],
            uvs: uv ? accessors[uv.index]?.data : []
        }
    })
}

export function unpackBufferViewData(
    buffers,
    bufferViews,
    length,
    elementBytesLength,
    typedGetter,
    bufferView
) {
    const worker = new WebWorker()
    return worker.createExecution({
        buffers,
        bufferViews,
        length,
        elementBytesLength,
        typedGetter,
        bufferView
    },

    `
    () => {
        self.addEventListener('message', event => {
            const {
                buffers,
                bufferViews,
                length,
                elementBytesLength,
                typedGetter,
                bufferView
            } = event.data
            let bufferId = bufferViews[bufferView].buffer;
            let offset = bufferViews[bufferView].byteOffset;

            let dv = buffers[bufferId];
            self.postMessage(Array.from({
                length
            }).map((el, i) => {
                let loopOffset = offset + Math.max(0, elementBytesLength * i);
                return dv[typedGetter](loopOffset, true);
            }))
        })
    }
    `)
}


export async function getBufferData(str, asBinary) {
    let byteCharacters = asBinary ? str : window.atob(str.replace('data:application/octet-stream;base64,', ''));

    let dv = new DataView(new ArrayBuffer(byteCharacters.length));

    Array.from(byteCharacters).forEach((char, i) => {
        dv.setUint8(i, char.charCodeAt(0));
    });

    return dv;
}