export const vertex = `#version 300 es

in vec3 position;
out vec2 texCoord;

void main() {
    texCoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}    
`

export const fragment = `#version 300 es

precision mediump float;

 
#define TEXEL 1.0 / 4092.

in vec2 texCoord;

uniform float indirectLightAmount;
uniform float sampleRadius;
uniform float samplesQuantity;
uniform float samplesTextureSize;

uniform sampler2D gNormalTex;
uniform sampler2D gWorldPosTex;
uniform sampler2D rNormalTex;
uniform sampler2D rWorldPosTex;
uniform sampler2D rFluxTex;
uniform sampler2D samplesTex;

uniform mat4 lightProjection;
uniform mat4 lightView;
out vec4 fragColor;

vec3 indirect() {
    vec3 P = texture(gWorldPosTex, texCoord).xyz;
    vec3 N = texture(gNormalTex, texCoord).xyz;
    vec4 texPos = (lightProjection * lightView * vec4(P, 1.0));
    texPos.xyz /= texPos.w;
    vec3 indirect = vec3(0.0, 0.0, 0.0);
    texPos.xyz = texPos.xyz * 0.5 + 0.5;

    for(int i = 0; i < int(samplesQuantity); i++) {
        vec3 s = texture(samplesTex, vec2( float(i) / samplesTextureSize,0.0)  ).xyz;
        vec2 offset = s.xy;
        float weight = s.z;
        vec2 coords = texPos.xy + offset * sampleRadius * TEXEL;
        vec3 vplPos = texture(rWorldPosTex, coords).xyz;
        vec3 vplNormal = texture(rNormalTex, coords).xyz;
        vec3 vplFlux = texture(rFluxTex, coords).xyz;
    
        vec3 result = vplFlux * (max(0.0, dot( vplNormal, normalize(P - vplPos) ))
                       * max(0.0, dot(N, normalize(vplPos - P) )));

        result *= weight * weight;
        result *= (1.0 / samplesQuantity);
        indirect += result;
    }

    return clamp(indirect * indirectLightAmount, 0.0, 1.0);
}
void main () {
    vec3 indirectColor = indirect();
    if(indirectColor.r == 0. && indirectColor.g == 0. && indirectColor.b == 0.)
        discard;
    fragColor = vec4( indirectColor, 1.);
}
`
