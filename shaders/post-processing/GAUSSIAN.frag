
precision highp float;
#define PI 3.14159265359

// BIG THANKS TO https://www.shadertoy.com/view/4tSyzy
in vec2 texCoords;
uniform sampler2D sceneColor;
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

    for (int x = -samples / 2; x < samples / 2; ++x) {
        for (int y = -samples / 2; y < samples / 2; ++y) {
            offset = vec2(x, y);
            weight = gaussian(offset);
            col += texture(sceneColor, texCoords + scale * offset).rgb * weight;
            accum += weight;
        }
    }

    if(accum > 0.)
        return col / accum;
    return texture(sceneColor, texCoords).rgb;
}

void main(){
    scale = 1./ vec2(textureSize(sceneColor, 0));
    samples = blurRadius;
    sigma = float(samples) * 0.25;

    fragColor = vec4(blur(), 1.);
}