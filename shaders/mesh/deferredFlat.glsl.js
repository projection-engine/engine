export const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoord;

void main() {
    texCoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}    

`

export const fragment = `#version 300 es
precision highp float;
in vec2 texCoord;

uniform sampler2D positionSampler;
uniform sampler2D albedoSampler;
uniform sampler2D normalSampler;

out vec4 finalColor;


void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    vec3 fragPosition = texelFetch(positionSampler, fragCoord, 0).xyz;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
    discard;
    
    
    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    float shadingIntensity = dot( normalize(texture(normalSampler, texCoord).rgb), vec3(0.0, 1.0, 0.0));
    float brightness = max(0.2, shadingIntensity);
    vec3 color = albedo* brightness;
 
 
    finalColor = vec4(color, 1.0);
}
`