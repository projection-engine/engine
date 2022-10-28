const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoords; 
void main() {
    texCoords = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}`
const fragment = `#version 300 es
precision mediump float;
#define THRESHOLD .0001
in vec2 texCoords;
uniform sampler2D uSampler; 
uniform sampler2D positionSampler;
uniform int option;
out vec4 fragColor;

float linearize(float depth){ 
    float near = .1;
    float far = 1000.;
    return (2. * near ) / (far + near - depth*(far -near)) ;
}

void main(){
     vec3 fragPosition = texture(positionSampler, texCoords).rgb;
     if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
            discard;
    vec4 samplerData = texture(uSampler, texCoords);
    vec3 color = samplerData.rgb; 
    
    if(option == 2){
        if(samplerData.r <= THRESHOLD)    
            discard;        
        color = vec3(linearize(color.r)) * 2.;
    }
    else if (option == 9)
        color = vec3(color.b);
    else if (option == 10)
        color = vec3(color.g);
    else if (option == 11 || option == 3)
        color = vec3(color.r);
    else if(option == 16)
        color = vec3(color.gb, 0.);
    fragColor = vec4(color, 1.);
}
`


export default {
    fragment,
    vertex
}