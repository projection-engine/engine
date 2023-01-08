precision highp float;

// THANKS TO  https://www.shadertoy.com/view/3sjBRR
#define GOLDEN_ANGLE 2.40
#define BLUR_NUMBER 100

//import(ppUBO)
//import(cameraUBO)
//import(depthReconstructionUtils)

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform sampler2D depthSampler;

out vec4 fragColor;



void main() {
    float iterations = float(BLUR_NUMBER);
    float DEPTH = texture(depthSampler, texCoords).r;
    float distanceFromCamera = length(viewSpacePositionFromDepth(DEPTH, texCoords) - placement.xyz);
    float percentage = min(distanceFromCamera, focusDistanceDOF) / focusDistanceDOF;
    float interpolation = DEPTH == 0. ? 1. : mix(0., 1., percentage);

        mat2 rotate2D = mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));

        vec3 col = vec3(0.);
        vec3 tot = col;
        float radius = (7.8 - 3.4 * apertureDOF) * interpolation;

        vec2 angle = vec2(vec2(radius) / (vec2(textureSizeXDOF, textureSizeYDOF) * focalLengthDOF * iterations));

        for (float i = 0.;i < iterations; ++i) {

            angle = rotate2D * angle;
            vec3 c = texture(sceneColor, texCoords + i * angle).rgb;
            vec3 bokeh = c;
            col += c * bokeh;
            tot += bokeh;
        }
        if(length(tot) > 0.)
            col /= tot;
        fragColor = vec4(col, 1.);

}

