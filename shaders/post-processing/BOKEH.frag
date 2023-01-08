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
    float DEPTH = texture(depthSampler, texCoords).r;
    float distanceFromCamera = length(viewSpacePositionFromDepth(DEPTH, texCoords) - placement.xyz);
    float percentage = min(distanceFromCamera, focusDistanceDOF)/focusDistanceDOF;
    float interpolation = mix( 0., 1., percentage);

    if(interpolation == 0. || DEPTH == 0.){
        fragColor = vec4(texture(sceneColor, texCoords).rgb, 1.);
    }else {
        mat2 rotate2D = mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));
        vec2 size = vec2(textureSize(sceneColor, 0));
        vec3 col = vec3(0.);
        vec3 tot = col;
        float radius = (7.8 - 3.4 * apertureDOF) * interpolation;

        vec2 angle = vec2(radius / (float(BLUR_NUMBER) * size.x));
        float r = 0.0;

        for (int i = 0;i < BLUR_NUMBER; ++i) {
            r += 1.;
            angle = rotate2D * angle;
            vec3 c = texture(sceneColor, texCoords + r * angle).rgb;
            c = c * c * 1.5;
            vec3 bokeh = pow(c, vec3(4.0));
            col += c * bokeh;
            tot += bokeh;
        }
        col /= tot;
        fragColor = vec4(col, 1.);
    }

}

