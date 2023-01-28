precision highp float;
in vec2 texCoords;
#define A  0.15
#define B  0.50
#define C  0.10
#define D  0.20
#define E  0.02
#define F  0.30
#define W  11.2

//import(ppUBO)

uniform sampler2D bloomColor;
uniform sampler2D sceneColor;

out vec4 fragColor;

//import(aces)

vec3 chromaticAberration(vec2 uv) {
    float amount = chromaticAberrationIntensity * .001;
    vec3 col;
    col.r = texture(sceneColor, vec2(uv.x + amount, uv.y)).r;
    col.g = texture(sceneColor, uv).g;
    col.b = texture(sceneColor, vec2(uv.x - amount, uv.y)).b;
    return col;
}
vec2 lensDistortion(vec2 uv, float k) {
    vec2 t = uv - .5;
    float r2 = t.x * t.x + t.y * t.y;
    float f = 1. + r2 * (.1 - k * sqrt(r2));

    vec2 nUv = f * t + .5;
    return nUv;
}
void uncharted2ToneMapping(inout vec3 color) {
    color *= exposure;
    color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
    float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
    color /= white;
    color = pow(color, vec3(1. / gamma));
}
void main(void) {

    vec2 texCoords = distortionEnabled ? lensDistortion(texCoords, distortionIntensity * .5) : texCoords;
    vec3 color = bloomEnabled ? aces(texture(bloomColor, texCoords).rgb) : vec3(0.);
    color += chromaticAberrationEnabled ? chromaticAberration(texCoords) : texture(sceneColor, texCoords).rgb;
    uncharted2ToneMapping(color);
    fragColor = vec4(color, 1.);

    if (vignetteEnabled) {
        vec2 uv = texCoords;
        uv *= 1.0 - uv.yx;
        float vig = pow(uv.x * uv.y * 15., vignetteStrength);
        fragColor.rgb *= vig;
    }
}