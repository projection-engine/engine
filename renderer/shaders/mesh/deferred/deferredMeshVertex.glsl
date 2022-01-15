#version 300 es


layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec;
uniform mat3 normalMatrix;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;


out vec3 normalVec;
out vec3 vPosition;
out vec2 texCoord;
out vec4 fragPosLightSpace;
out vec3 lightDir;
out vec3 dirAmbient;
out vec3 dirDirection;
out vec3 viewDir;


void main() {

}
