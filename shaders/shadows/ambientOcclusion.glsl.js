export const vertex = `#version 300 es

layout (location = 0) in vec3 Position;

uniform float gAspectRatio;
uniform float gTanHalfFOV;

out vec2 TexCoord;
out vec2 ViewRay;

void main()
{
    gl_Position = vec4(Position, 1.0);
    TexCoord = (Position.xy + vec2(1.0)) / 2.0;
    ViewRay.x = Position.x * gAspectRatio * gTanHalfFOV;
    ViewRay.y = Position.y * gTanHalfFOV;
}
`
export const fragment = `#version 300 es

in vec2 TexCoord;
in vec2 ViewRay;

out vec4 FragColor;

uniform sampler2D gDepthMap;
uniform float gSampleRad;
uniform mat4 gProj;

const int MAX_KERNEL_SIZE = 64;
uniform vec3 gKernel[MAX_KERNEL_SIZE];


float CalcViewZ(vec2 Coords)
{
    float Depth = texture(gDepthMap, Coords).x;
    float ViewZ = gProj[3][2] / (2 * Depth -1 - gProj[2][2]);
    return ViewZ;
}


void main()
{
    float ViewZ = CalcViewZ(TexCoord);

    float ViewX = ViewRay.x * ViewZ;
    float ViewY = ViewRay.y * ViewZ;

    vec3 Pos = vec3(ViewX, ViewY, ViewZ);

    float AO = 0.0;

    for (int i = 0 ; i < MAX_KERNEL_SIZE ; i++) {
        vec3 samplePos = Pos + gKernel[i];
        vec4 offset = vec4(samplePos, 1.0);
        offset = gProj * offset;
        offset.xy /= offset.w;
        offset.xy = offset.xy * 0.5 + vec2(0.5);

        float sampleDepth = CalcViewZ(offset.xy);

        if (abs(Pos.z - sampleDepth) < gSampleRad) {
            AO += step(sampleDepth,samplePos.z);
        }
    }

    AO = 1.0 - AO/64.0;

    FragColor = vec4(pow(AO, 2.0));
}
`


export const fragmentBlur = `#version 300 es

precision highp float;
out float fragColor;

in vec2 texCoords;

uniform sampler2D aoSampler;

void main() 
{
    vec2 texelSize = 1.0 / vec2(textureSize(aoSampler, 0));
    float result = 0.0;
    for (int x = -2; x < 2; ++x) 
    {
        for (int y = -2; y < 2; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(aoSampler, texCoords + offset).r;
        }
    }
    fragColor = result / (4.0 * 4.0);
}  

`
