
precision highp float;

// THANKS TO https://www.shadertoy.com/view/XlSBRW
const float PI = 3.14;
in vec2 texCoords;
uniform sampler2D sceneColor;
uniform sampler2D depthSampler;
uniform float radius;
out vec4 fragColor;

float depthToMask(float d) {
    d *= 100.0;
    d = abs(d -8.5);
    d = pow(d, 6.0);
    d = clamp(d, 0.0, 1.0);
    return d;
}

vec4 bokeh(){
    vec2 res = vec2(textureSize(sceneColor, 0));
    float blurCircles = 4.0;// * (radius * 12.0);

    float totalSamples = 0.0;
    vec3 colAcum = vec3(0.0);

    for(float currentCircle = 0.0; currentCircle < blurCircles; currentCircle++) {
        float samplesForCurrentCircle = (pow((currentCircle + 1.0), 2.0) - pow(currentCircle, 2.0)) * 4.0;
        float currentRadius = (radius / float(blurCircles)) * (float(currentCircle) + 0.5);


        for(float currentSample = 0.0; currentSample < samplesForCurrentCircle; currentSample++) {
            vec2 samplePoint = vec2(0.0, currentRadius);
            float angle = (2.0 * PI) * ((currentSample + 0.5) / samplesForCurrentCircle);

            float s = sin(angle);
            float c = cos(angle);
            mat2 m = mat2(c, -s, s, c);
            samplePoint = m * samplePoint;

            samplePoint *= vec2(res.y / res.x, 1.0);

            totalSamples++;
            colAcum += textureLod(sceneColor, texCoords + samplePoint, radius * 30.0).rgb;
        }
    }
    return vec4(colAcum , 1.);
}

void main() {
    fragColor = bokeh();
}

