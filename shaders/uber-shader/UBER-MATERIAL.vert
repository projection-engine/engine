layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

uniform mat4 viewProjection;
uniform mat4 modelMatrix;

uniform mat4 viewMatrix;
uniform mat4 skyProjectionMatrix;


uniform mat3 materialAttributes;

out vec3 normalVec;
out vec3 worldSpacePosition;
out vec2 texCoords;
out mat3 matAttr;

void main(){
    mat4 M = modelMatrix;

    matAttr = materialAttributes;
    bool isSky = materialAttributes[1][1] == 1.;
    if(isSky){
        M[3][0] = 0.;
        M[3][1] = 0.;
        M[3][2] = 0.;
    }

    vec4 wPosition = M * vec4(position, 1.0);
    worldSpacePosition = wPosition.xyz;
    normalVec = normalize(mat3(M) * normal);
    texCoords = uvTexture;

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
