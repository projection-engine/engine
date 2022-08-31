import ShaderInstance from "../../controllers/instances/ShaderInstance"
import COMPONENTS from "../../data/COMPONENTS"
import * as shaderCode from "../../data/shaders/DEFERRED.glsl"
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/apis/CameraAPI";
import GPU from "../../controllers/GPU";
import STATIC_FRAMEBUFFERS from "../../../static/STATIC_FRAMEBUFFERS";

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
export default class DepthPass {
    static framebuffer
    static normalFBO
    static depth
    static normal

    static shader
    static normalShader
    static initialize() {
        DepthPass.framebuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEPTH)
        DepthPass.framebuffer
            .texture({
                precision: gpu.RGBA32F,
                format: gpu.RGBA,
                type: gpu.FLOAT
            })
            .depthTest()
        DepthPass.depth = DepthPass.framebuffer.colors[0]

        DepthPass.normalFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.RECONSTRUCTED_NORMALS)
        DepthPass.normal = DepthPass.normalFBO.colors[0]

        DepthPass.shader = new ShaderInstance(vertex, frag)
        DepthPass.normalShader = new ShaderInstance(shaderCode.vertex, normal)
    }

    static execute() {
        const meshes = RendererController.data.meshes
        // DEPTH && ID
        DepthPass.framebuffer.startMapping()
        for (let i = 0; i < meshes.length; i++) {
            const entity = meshes[i]
            if (!entity.active)
                continue
            const mesh = GPU.meshes.get(entity.components[COMPONENTS.MESH].meshID)
            if (!mesh)
                continue
            mesh.useForDepth()
            DepthPass.shader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                transformMatrix: entity.transformationMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                meshID: entity.pickID
            })
            mesh.draw()
        }
        DepthPass.framebuffer.stopMapping()


        // NORMALS
        DepthPass.normalFBO.startMapping()
        DepthPass.normalShader.bindForUse({
            depthSampler: DepthPass.depth,
            projectionInverse: CameraAPI.invProjectionMatrix,
            viewInverse: CameraAPI.invViewMatrix
        })
        GPU.quad.draw()
        DepthPass.normalFBO.stopMapping()

        gpu.bindVertexArray(null)
    }
}