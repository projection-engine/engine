#version 300 es
layout (location = 0) in vec3 position;


uniform vec2 resolution;
uniform bool isWidth;

out vec2 blurTextureCoords[11];

void main() {
    vec2 texCoords = (position.xy) * 0.5 + 0.5;
    float pixelSize;

    if(isWidth == true)
    pixelSize = 1./resolution.x;
    else
    pixelSize = 1./resolution.y;

    vec2 vector;
    for(int i = -5; i <= 5; i++){

        if(isWidth == true)
        vector = vec2(pixelSize * float(i), 0.);
        else
        vector = vec2(0., pixelSize * float(i));
        blurTextureCoords[i + 5] =   texCoords + vector;
    }

    gl_Position = vec4(position, 1.0);
}