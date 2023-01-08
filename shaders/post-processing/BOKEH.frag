precision highp float;

//import(ppUBO)

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform sampler2D depthSampler;

out vec4 fragColor;


void main() {
    fragColor = texture(sceneColor, texCoords)/2.;
}

