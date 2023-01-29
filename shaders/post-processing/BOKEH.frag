precision highp float;

// THANKS TO  https://www.shadertoy.com/view/3sjBRR
#define GOLDEN_ANGLE 2.40
#define BLUR_NUMBER 100
#define ROTATE_2D mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE))
#define APERTURE 7.8

//import(ppUBO)
//import(cameraViewInfo)
//import(sceneDepthUtils)

in vec2 texCoords;
uniform sampler2D sceneColor;

out vec4 fragColor;



void main() {

    float iterations = float(BLUR_NUMBER);
    float DEPTH = getLogDepth(texCoords);
    float distanceFromCamera = length(viewSpacePositionFromDepth(DEPTH, texCoords) - placement.xyz);
    float percentage = min(distanceFromCamera, focusDistanceDOF) / focusDistanceDOF;
    float interpolation = DEPTH == 0. ? 1. : mix(0., 1., percentage);
    vec3 col = vec3(0.);
    vec3 tot = col;
    float radius = (APERTURE - APERTURE * .5 * apertureDOF) * interpolation;
    vec2 angle = vec2(radius / (max(textureSizeXDOF, textureSizeYDOF) * focalLengthDOF * iterations));

    for (float i = 0.;i < iterations; ++i) {
        angle = ROTATE_2D * angle;
        vec3 c = texture(sceneColor, texCoords + i * angle).rgb;
        col += c * c;
        tot += c;
    }
    if (length(tot) > 0.)
    col /= tot;
    fragColor = vec4(col, 1.);

}

