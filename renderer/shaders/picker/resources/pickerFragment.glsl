#version 300 es
precision highp float;

uniform vec4 uID;

out vec4 fragColor;

void main() {
    fragColor = uID;
}