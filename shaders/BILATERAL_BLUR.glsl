#version 300 es
precision highp float;
#define PI 3.14159265359
in vec2 texCoords;

uniform sampler2D sceneColor;//color buffer
uniform sampler2D gMeshID;//ID buffer
uniform int blurRadius;
out vec4 fragColor;

int samples;
float sigma;
vec2 scale;

float gaussian(vec2 i) {
    return 1.0 / (2.0 * PI * pow(sigma, 2.)) * exp(-((pow(i.x, 2.) + pow(i.y, 2.)) / (2.0 * pow(sigma, 2.))));
}

vec3 blur() {
    vec3 col = vec3(0.0);
    float accum = 0.0;
    float weight;
    vec2 offset;
    vec2 scaledOffset;
    vec4 root = texture(gMeshID, texCoords);
    if (root.a < 1.) discard;

    for (int x = -samples / 2; x < samples / 2; ++x) {
        for (int y = -samples / 2; y < samples / 2; ++y) {
            offset = vec2(x, y);
            scaledOffset = scale * offset;
            if (root.rgb == texture(gMeshID, texCoords + scaledOffset).rgb){
                weight = gaussian(offset);
                col += texture(sceneColor, texCoords + scaledOffset).rgb * weight;
                accum += weight;
            }
        }
    }

    if(accum > 0.)
    return col / accum;
    return texture(sceneColor, texCoords).rgb;
}

void main(){
    scale = 1. / vec2(textureSize(sceneColor, 0));
    samples = blurRadius;
    sigma = float(samples) * 0.25;

    fragColor = vec4(blur(), 1.);
}