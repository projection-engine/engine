#version 300 es
precision highp float;

// IN
in vec4 vPosition;
in vec3 normalVec;

uniform vec3 cameraVec;
// OUTPUTS
out vec4 fragColor;



void main(){
    float shadingIntensity = dot( normalize(normalVec), vec3(0.0, 1.0, 0.0));
    float brightness = max(0.2, shadingIntensity);
    vec3 color = vec3(1.0, 1.0, 0.0) * brightness;
    fragColor = vec4(color, 0.7);
}