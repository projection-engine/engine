import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import COMPONENTS from "../../../data/COMPONENTS"
import * as shaderCode from "../../../data/shaders/DEFERRED.glsl"
import RendererController from "../../../RendererController";
import CameraAPI from "../../apis/CameraAPI";

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
uniform vec3 meshID;
out vec4 fragDepth;

void main(void){
    fragDepth = vec4(vPosition.z/vPosition.w, meshID.r, meshID.g, 1.);  
}
`
const normal = `#version 300 es
precision highp  float;
 
#define THRESHOLD .001
in vec2 texCoord;  
uniform sampler2D depthSampler;
uniform mat4 projectionInverse;
uniform mat4 viewInverse; 
out vec4 fragNormal;

 
vec3 reconstructPosition(vec2 uv, float z, mat4 InvVP)
{
  float x = uv.x * 2. - 1.;
  float y = (1.0 - uv.y) * 2. - 1.;
  vec4 position_s = vec4(x, y, z, 1.);
  vec4 position_v =  InvVP * position_s;
  return position_v.xyz / position_v.w;
}
 

void main(void){ 
    float depth = texture(depthSampler, texCoord).r;
    if(depth <= THRESHOLD)
        discard;
    vec3 P0 = reconstructPosition(texCoord, depth, viewInverse * projectionInverse);   
    vec3 normal = normalize(cross(dFdx(P0), dFdy(P0)));
 
    fragNormal = vec4(normalize(vec4(normal, 1.)).rgb, 1.);
}`
export default class DepthPrePass {

    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        this.frameBuffer = new FramebufferInstance( resolution.w, resolution.h).texture({
            precision: gpu.RGBA32F,
            format: gpu.RGBA,
            type: gpu.FLOAT
        }).depthTest()
        this.normalFrameBuffer = new FramebufferInstance( resolution.w, resolution.h).texture()

        this.shader = new ShaderInstance(vertex, frag)
        this.normalShader = new ShaderInstance(shaderCode.vertex, normal)
    }
    get depth(){
        return this.frameBuffer.colors[0]
    }
    get normal(){
        return this.normalFrameBuffer.colors[0]
    }
    execute() {
        const meshes = RendererController.data.meshes
        // DEPTH && ID
        this.frameBuffer.startMapping()
        for(let i = 0; i < meshes.length; i++){
            const entity = meshes[i]
            if(!entity.active)
                continue
            const mesh = RendererController.meshes.get(entity.components[COMPONENTS.MESH].meshID)
            if(!mesh)
                continue
            mesh.useForDepth()
            this.shader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                transformMatrix: entity.components[COMPONENTS.TRANSFORM].transformationMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                meshID: entity.pickID
            })
            mesh.draw()
        }
        this.frameBuffer.stopMapping()


        // NORMALS
        this.normalFrameBuffer.startMapping()
        this.normalShader.bindForUse({
            depthSampler: this.depth,
            projectionInverse: CameraAPI.invProjectionMatrix,
            viewInverse: CameraAPI.invViewMatrix
        })
        this.normalFrameBuffer.draw()
        this.normalFrameBuffer.stopMapping()

        gpu.bindVertexArray(null)
    }
}