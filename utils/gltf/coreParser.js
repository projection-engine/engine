import nodeParser from "./nodeParser";
import FileBlob from "../../../../views/editor/utils/classes/FileBlob";
import {WebWorker} from "../../../../views/editor/utils/classes/Worker";


export default function coreParser(file, files) {
    return new Promise(rootResolve => {
        FileBlob
            .loadAsString(file)
            .then(blob => {
                const parsed = JSON.parse(blob)
                const bufferPromises = parsed.buffers.map(b => {
                    if (b.uri.includes('base64'))
                        return new Promise(resolve => {
                            getBufferData(b.uri).then(res => resolve(res))
                        })
                    else {
                        const found = files.find(f => {
                            return f.webkitRelativePath.includes(b.uri)
                        })

                        if (found)
                            return  new Promise(resolve => {

                                FileBlob.loadAsString(found, true)
                                    .then(r => {
                                        console.log(r.length)
                                        getBufferData(r, true).then(res => resolve(res))
                                    })

                            })
                        else
                            return new Promise((_, reject) => reject())
                    }
                })

                Promise.all(bufferPromises).then(parsedBuffers => {

                    let accessorPromises = parsed.accessors.map(a => {
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

                        return new Promise(resolve => {
                            unpackBufferViewData(
                                parsedBuffers,
                                parsed.bufferViews,
                                length,
                                elementBytesLength,
                                typedGetter,
                                a.bufferView
                            ).then(res => resolve({
                                ...a,
                                data: res
                            }))

                        })

                    })

                    Promise.all(accessorPromises).then(parsedAccessors => {
                        const mainScene = parsed.scenes[0]

                        let sceneNodes = parsed.nodes.filter((n, index) => {
                            return mainScene.nodes.includes(index) && n.mesh !== undefined
                        }).map(nodeParser)


                        let meshes = parsed.meshes.filter((_, index) => {
                            return sceneNodes.find(n => n.meshIndex === index) !== undefined
                        }).map(m => {
                            return getPrimitives(m, parsedAccessors, parsed.materials)[0]
                        })

                        rootResolve({
                            meshes: meshes,
                            nodes: sceneNodes
                        })
                    }).catch(() => rootResolve())
                }).catch(() => rootResolve())
            }).catch(() => rootResolve())
    })
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
        const vert = p.attributes.find(d => d.name === 'POSITION')
        const norm = p.attributes.find(d => d.name === 'NORMAL')
        const tang = p.attributes.find(d => d.name === 'TANGENT')
        const uv = p.attributes.find(d => d.name === 'TEXCOORD_0')


        return {
            indices: p.indices.data,
            vertices: vert ? vert.data : [],
            tangents: tang ? tang.data : [],
            normals: norm ? norm.data : [],
            uvs: uv ? uv.data : []
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
    const worker = new WebWorker()
    return worker.createExecution({
        buffers,
        bufferViews,
        length,
        elementBytesLength,
        typedGetter,
        bufferView
    }, () => {
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
    })
}


async function getBufferData(str, asBinary) {
    let byteCharacters = asBinary ? str : window.atob(str.replace('data:application/octet-stream;base64,', ''));

    let dv = new DataView(new ArrayBuffer(byteCharacters.length));

    Array.from(byteCharacters).forEach((char, i) => {
        dv.setUint8(i, char.charCodeAt(0));
    });

    return dv;
}