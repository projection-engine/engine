#version 300 es

// IN
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

uniform mat3 normalMatrix;

// OUT

out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);

    normalVec =   normalMatrix * normal;
    normalVec =   normalize(normalVec);

    // NORMALS
    vec3 bitangent = normalize(cross(normalVec, tangentVec));
    toTangentSpace = mat3(
    tangentVec.x, bitangent.x, normalVec.x,
    tangentVec.y, bitangent.y, normalVec.y,
    tangentVec.z, bitangent.z, normalVec.z
    );
    toTangentSpace = transpose(toTangentSpace);


    // FRAGMENT IN

    texCoord = uvTexture;


    // END
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}