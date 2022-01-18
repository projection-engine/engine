#version 300 es

in vec3 position;

struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};
uniform DirectionalLight dirLight;
uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;

out vec2 texCoord;
out vec4 fragPosLightSpace;

out vec3 dirAmbient;
out vec3 dirDirection;
out vec3 flippedLight;
out mat4 lightSpaceMatrix;
void main() {

    dirAmbient = dirLight.ambient;

    flippedLight = dirLight.direction;
    flippedLight.z  = -flippedLight.z;
    dirDirection = flippedLight;

    lightSpaceMatrix = lightProjectionMatrix * lightViewMatrix;

    texCoord = (position.xy) * 0.5 + 0.5;


    gl_Position = vec4(position, 1);
}    
