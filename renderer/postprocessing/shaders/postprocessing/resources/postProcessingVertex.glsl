#version 300 es

in vec3 position;
out vec2 vTexcoord;

void main() {
    vTexcoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}    
