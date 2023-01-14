precision highp float;
#define PI 3.14159265359

// BIG THANKS TO https://www.shadertoy.com/view/4tSyzy
in vec2 texCoords;
uniform sampler2D sceneColor;
uniform int blurRadius;
out vec4 fragColor;

void main(){
    vec2 texelSize = 1./ vec2(textureSize(sceneColor, 0));
    float sigma = float(blurRadius) * 0.25;
    vec3 col = vec3(0.0);
    float accum = 0.0;
    float weight;
    vec2 offset;

    for (int x = -blurRadius / 2; x < blurRadius / 2; ++x) {
        for (int y = -blurRadius / 2; y < blurRadius / 2; ++y) {
            offset = vec2(x, y);
            weight = 1.0 / (2.0 * PI * pow(sigma, 2.)) * exp(-((pow(offset.x, 2.) + pow(offset.y, 2.)) / (2.0 * pow(sigma, 2.))));
            col += texture(sceneColor, texCoords + texelSize * offset).rgb * weight;
            accum += weight;
        }
    }

    if(accum > 0.)
        fragColor = vec4(col / accum, 1.);
    else
        fragColor = vec4(texture(sceneColor, texCoords).rgb, 1.);
}