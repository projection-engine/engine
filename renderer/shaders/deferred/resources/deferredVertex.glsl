#version 300 es
#define MAX_LIGHTS 2

in vec3 position;

struct DirectionalLightPOV {
    mat4 lightProjectionMatrix;
    mat4 lightViewMatrix;
};
uniform DirectionalLightPOV directionalLightsPOV[MAX_LIGHTS];
uniform int dirLightQuantity;


out vec2 texCoord;
out mat4 lightSpaceMatrix;
out float hasDirLight;
out mat4 dirLightPOV[MAX_LIGHTS];
flat out int dirLightsQuantity;

void main() {
    dirLightsQuantity = dirLightQuantity;
    for (int i = 0; i< dirLightQuantity; i++){
        dirLightPOV[i] = directionalLightsPOV[i].lightProjectionMatrix * directionalLightsPOV[i].lightViewMatrix;
    }


    texCoord = (position.xy) * 0.5 + 0.5;


    gl_Position = vec4(position, 1);
}    
