layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

uniform mat4 viewProjection;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 skyProjectionMatrix;
uniform mat3 materialAttributes;

out vec3 naturalNormal;
out vec3 worldPosition;
out vec2 naturalTextureUV;
out mat3 matAttr;
out mat4 invModelMatrix;

void main(){
    mat4 M = modelMatrix;
    invModelMatrix = inverse(modelMatrix);
    matAttr = materialAttributes;
    bool isSky = materialAttributes[1][1] == 1.;
    if(isSky){
        M[3][0] = 0.;
        M[3][1] = 0.;
        M[3][2] = 0.;
    }

    vec4 wPosition = M * vec4(position, 1.0);
    worldPosition = wPosition.xyz;
    naturalNormal = normalize(mat3(M) * normal);
    naturalTextureUV = uvTexture;

    if(isSky){
        mat4 V = viewMatrix;
        V[3][0] = 0.;
        V[3][1] = 0.;
        V[3][2] = 0.;
        gl_Position = skyProjectionMatrix * V * wPosition;
    }
    else
        gl_Position = viewProjection * wPosition;
}
