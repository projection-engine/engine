const vertex = `#version 300 es
layout (location = 0) in vec3 position;
layout (location = 1) in mat4 transformationMatrix;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix; 

out vec2 texCoords;

void main(){
    texCoords = position.xy * .5 + .5;
    gl_Position = projectionMatrix * viewMatrix * transformationMatrix * vec4(position, 1.0);
}
`


const fragment = `#version 300 es
precision lowp float;

in vec2 texCoords;

uniform sampler2D iconSampler;
out vec4 finalColor;

void main()
{
    vec4 color = texture(iconSampler, texCoords).rgba;
    if(color.a <= .1)
        discard;
    else
        finalColor = vec4(color);
}
`


export default {fragment, vertex}