import nodeParser from "./nodeParser";

export default function coreParser(fileData) {
    try {
        const parsed = JSON.parse(fileData)
        const parsedBuffers = parsed.buffers.map(b => {
            return getBufferData(b.uri)
        })
        let parsedAccessors = []
        parsedAccessors = parsed.accessors.map((a, i) => {
            let items = 0
            switch (a.type) {
                case 'SCALAR':
                    items = 1
                    break
                case 'VEC2':
                    items = 2
                    break
                case 'VEC3':
                    items = 3
                    break
                case 'VEC4':
                    items = 4
                    break
                default:
                    break
            }

            let elementBytesLength = (a.componentType === 5123 ? Uint16Array : Float32Array).BYTES_PER_ELEMENT;
            let typedGetter = a.componentType === 5123 ? 'getUint16' : 'getFloat32'
            const length = items * a.count;

            return {
                ...a,
                data: unpackBufferViewData(
                    parsedBuffers,
                    parsed.bufferViews,
                    length,
                    elementBytesLength,
                    typedGetter,
                    a.bufferView
                )
            }

        })

        const mainScene = parsed.scenes[0]
        let sceneNodes = parsed.nodes.filter((n, index) => {
            return mainScene.nodes.includes(index) && n.mesh !== undefined
        }).map(nodeParser)

        let meshes = parsed.meshes.filter((_, index) => {
            return sceneNodes.find(n => n.meshIndex === index) !== undefined
        }).map(m => {
            return getPrimitives(m, parsedAccessors, parsed.materials)[0]
        })

        return {
            meshes: meshes,
            nodes: sceneNodes
        }
    } catch (e) {
        return {
            meshes: [],
            nodes: []
        }
    }

}

function getPrimitives(mesh, accessors, materials = []) {
    const primitives = mesh.primitives;

    primitives.forEach(primitive => {
        primitive.attributes = Object.keys(primitive.attributes).map(name => ({
            name,
            ...accessors[primitive.attributes[name]]
        }))


        primitive.indices = {...accessors[primitive.indices]};
        if (typeof primitive.material !== "undefined") {
            primitive.material = materials[primitive.material];
        }
    });
    return primitives.map(p => {
        const vert =  p.attributes.find(d => d.name === 'POSITION')
        const norm =  p.attributes.find(d => d.name === 'NORMAL')
        const tang =  p.attributes.find(d => d.name === 'TANGENT')
        const uv =  p.attributes.find(d => d.name === 'TEXCOORD_0')


        return {
            indices: p.indices.data,
            vertices: vert ? vert.data : [],
            tangents: tang ? tang.data : [],
            normals: norm ? norm.data : [],
            uvs:uv ? uv.data : []
        }
    })
}

function unpackBufferViewData(
    buffers,
    bufferViews,
    length,
    elementBytesLength,
    typedGetter,
    bufferView
) {
    let bufferId = bufferViews[bufferView].buffer;
    let offset = bufferViews[bufferView].byteOffset;

    let dv = buffers[bufferId];
    return Array.from({
        length
    }).map((el, i) => {
        let loopOffset = offset + Math.max(0, elementBytesLength * i);
        return dv[typedGetter](loopOffset, true);
    });
}


function getBufferData(str) {
    let byteCharacters = window.atob(str.replace('data:application/octet-stream;base64,', ''));
    let dv = new DataView(new ArrayBuffer(byteCharacters.length));

    Array.from(byteCharacters).forEach((char, i) => {
        dv.setUint8(i, char.charCodeAt(0));
    });

    return dv;
}