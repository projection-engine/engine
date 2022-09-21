const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoord; 
void main() {
    texCoord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}`
const fragment = `#version 300 es
precision mediump float;
#define THREASHOLD .0001
in vec2 texCoord;
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
     vec3 fragPosition = texture(positionSampler, texCoord).rgb;
     if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
            discard;
    vec4 samplerData = texture(uSampler, texCoord);
    vec3 color = samplerData.rgb; 
    
    if(option == 2){
        if(samplerData.r <= THREASHOLD)    
            discard;        
        color = vec3(linearize(samplerData.r)) * 5.;
    }
    else if (option == 9){
        color = vec3(samplerData.b); 
    }
    else if (option == 10){
        color = vec3(samplerData.g);
    }
    else if (option == 11){
        color = vec3(samplerData.r);
    }

    fragColor = vec4(color, 1.);
}
`


export default {
    fragment,
    vertex
}