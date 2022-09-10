export const vertex = `#version 300 es
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normalVec;
 
uniform mat4 viewMatrix;
uniform mat4 transformMatrix; 
uniform mat4 projectionMatrix;

out vec3 normal;

void main() {
	normal = normalize(transformMatrix * normalVec); 
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
}`

export const fragment = `#version 300 es
precision highp float;
in vec2 texCoord;
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