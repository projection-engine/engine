import TEMPLATE_VERTEX from "../../shaders/TEMPLATE_VERTEX_SHADER.vert"
export const vertex = TEMPLATE_VERTEX

export const fragment = `#version 300 es
precision highp float;
in vec2 texCoords;
in vec3 normal;

uniform bool normalView;
uniform bool translucent;

out vec4 finalColor;

void main() {
	if(normalView)
		finalColor = vec4(normal, 1.);
	else
    	finalColor = vec4(vec3(.5), translucent ? .5 : 1.0);
}
`