#define SKY 6.

layout (location = 0) in vec3 position;
layout (location = 1) in vec2 uvTexture;
layout (location = 2) in vec3 normal;

uniform mat4 viewProjection;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 skyProjectionMatrix;
uniform mat4 materialAttributes;
uniform bool isDecalPass;

out vec3 naturalNormal;
out vec3 worldPosition;
out vec2 naturalTextureUV;
out mat4 matAttr;
out mat4 invModelMatrix;

void main(){
    matAttr = materialAttributes;
    bool isSky = materialAttributes[0][3] == SKY;
    vec4 wPosition =  vec4(position, 1.0);

    if(isSky){
        mat4 M = modelMatrix;
        M[3][0] = 0.;
        M[3][1] = 0.;
        M[3][2] = 0.;

        wPosition = M * wPosition;

        mat4 V = viewMatrix;
        V[3][0] = 0.;
        V[3][1] = 0.;
        V[3][2] = 0.;

        invModelMatrix = mat4(0.);
        worldPosition = wPosition.xyz;
        naturalNormal = vec3(0.);
        naturalTextureUV = uvTexture;

        gl_Position = skyProjectionMatrix * V * wPosition;
    }else{
        wPosition = modelMatrix * wPosition;

        invModelMatrix = isDecalPass ? inverse(modelMatrix) : mat4(0.);
        worldPosition = wPosition.xyz;
        naturalNormal = normalize(mat3(modelMatrix) * normal);
        naturalTextureUV = uvTexture;

        gl_Position = viewProjection * wPosition;
    }
}
