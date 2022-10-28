#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;


uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

out vec3 normalVec;
out vec2 texCoords;

void main(){
    normalVec =  normalize(mat3(transformMatrix) * normal);
    texCoords = uvTexture;
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.);
}
