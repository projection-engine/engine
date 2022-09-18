const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoord; 
void main() {
    texCoord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}`
const fragment = `#version 300 es
precision mediump float;
in vec2 texCoord;
uniform sampler2D uSampler; 
uniform int option;
out vec4 fragColor;

float linearize(float depth){ 
    float near = .1;
    float far = 1000.;
    return (2.*near ) / (far + near - depth*(far -near)) ;
}

void main(){
    vec4 samplerData = texture(uSampler, texCoord);
    vec3 color = samplerData.rgb; 
    
    if(option == 2)
        color = vec3(linearize(samplerData.r));
   
    fragColor = vec4(color, 1.);
}
`


export default {
    fragment,
    vertex
}