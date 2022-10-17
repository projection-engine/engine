const vertex = `#version 300 es
layout (location = 0) in vec3 position; 
 
uniform mat4 viewMatrix;
uniform mat4 transformMatrix; 
uniform mat4 projectionMatrix;
 

void main() { 
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
}`
const fragment = `#version 300 es
precision lowp float;
out vec4 finalColor;
void main() {
    finalColor = vec4(0., 5., .0, .25);
}
`

export default {
    vertex,
    fragment
}