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
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;

struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};
uniform DirectionalLight dirLight;


// OUT

out vec3 vPosition;
out vec2 texCoord;
out vec4 fragPosLightSpace;
out vec3 lightDir;
out vec3 dirAmbient;
out vec3 dirDirection;
out mat3 toTangentSpace;
out vec3 normalVec;

void main(){


    vec4 transformed =  transformMatrix *   vec4(position, 1.0);
    mat4 lightSpaceMatrix = lightProjectionMatrix * lightViewMatrix;

    fragPosLightSpace  = lightSpaceMatrix * transformed;
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
    vPosition = vec3(transformed);
    texCoord = uvTexture;
    dirAmbient = dirLight.ambient;

    vec3 flippedLight = dirLight.direction;
    flippedLight.z  = -flippedLight.z;
    dirDirection = flippedLight;

    lightDir =  normalize(flippedLight - vPosition);


    // END
    gl_Position = projectionMatrix * viewMatrix * transformed;
}