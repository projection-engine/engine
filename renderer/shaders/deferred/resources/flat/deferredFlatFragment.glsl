#version 300 es
precision highp float;
in vec2 texCoord;

uniform sampler2D positionSampler;
uniform sampler2D albedoSampler;


out vec4 finalColor;


void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    vec3 fragPosition = texelFetch(positionSampler, fragCoord, 0).xyz;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
    discard;

    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    albedo = albedo / (albedo + vec3(1.0));
    finalColor = vec4(albedo, 1.0);
}
