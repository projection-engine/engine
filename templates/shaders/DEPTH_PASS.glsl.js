const depthVertex = `#version 300 es

layout (location = 0) in vec3 position;
layout (location = 2) in vec2 uv;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
 
out vec2 texCoords;
void main() { 
    texCoords = uv;
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position , 1.) ;
}
`
const depthFragment = `#version 300 es
precision highp  float;
in vec2 texCoords;
 
uniform vec3 meshID;
layout (location = 0) out vec4 gDepth;
layout (location = 1) out vec4 gID;
layout (location = 2) out vec4 gUV;

void main(void){
    gUV = vec4(texCoords, 0., 1.);
    gID = vec4(meshID, 1.); 
    gDepth = vec4(gl_FragCoord.z, 0.,0., 1.);  
}
`
const normalReconstructionFragment = `#version 300 es
precision highp  float;
 
#define THRESHOLD .0000001
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
 
    fragNormal = vec4(normalize(normal) , 1.);
}`

export default {
    depthVertex,
    depthFragment,
    normalReconstructionFragment
}