import System from "../basic/System"
import FramebufferInstance from "../instances/FramebufferInstance"
import ShaderInstance from "../instances/ShaderInstance"
import COMPONENTS from "../templates/COMPONENTS"

const vertex = `#version 300 es

layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
out vec4 vPosition;
 
void main() { 
    vPosition = projectionMatrix * viewMatrix * transformMatrix * vec4(position , 1.) ;
    gl_Position = vPosition;
}
`
const frag = `#version 300 es
precision highp  float;

in vec4 vPosition;
out vec4 fragDepth;
uniform vec3 meshID;

void main(void){
    fragDepth = vec4(vPosition.z/vPosition.w, meshID.r, meshID.g, 1.);
}
`

// const depth = `#version 300 es
// precision highp  float;
//
// in vec4 vPosition;
// out vec4 fragDepth;
//
// void editor(void){
//     fragDepth = vec4(vec3(vPosition.z/vPosition.w), 1.);
// }
// `
export default class DepthSystem extends System {

    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super();
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({
                precision: this.gpu.R32F,
                format: this.gpu.RED,
                type: this.gpu.FLOAT,
                linear: true,
                repeat: true
            })
            .depthTest()

        this.shader = new ShaderInstance(vertex, frag, gpu)
    }
    get depth(){
        return this.frameBuffer.colors[0]
    }
    execute(options, systems, data) {
        super.execute()
        const {meshes, meshSources} = data
        const {camera} = options

        this.frameBuffer.startMapping()
        this.shader.use()
        for(let i in meshes){
            const mesh = meshes[i]
            const meshRef = meshSources[mesh.components[COMPONENTS.MESH].meshID]
            if(meshRef) {

                meshRef.use()
                this.shader.bindForUse({
                    viewMatrix: camera.viewMatrix,
                    transformMatrix: mesh.components[COMPONENTS.TRANSFORM].transformationMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    meshID: mesh.components[COMPONENTS.PICK].pickID
                })

                this.gpu.drawElements(this.gpu.TRIANGLES, meshRef.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
                meshRef.finish()
            }
        }

        this.frameBuffer.stopMapping()
        this.gpu.bindVertexArray(null)
    }
}