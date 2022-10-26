export const brightFragment = `#version 300 es

precision lowp float;

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform float threshold;
out vec4 fragColor;


void main(){
    vec4 color = texture(sceneColor, texCoords);
    float brightness = (color.r  * 0.2126 ) + (color.g  * 0.7152 ) +  (color.b * 0.0722 );
    if (brightness > threshold)
        fragColor = color;
       
    else 
        fragColor = vec4(0.,0.,0.,1.);
   
     
}`

export const blurBox = `#version 300 es

precision mediump float;

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform vec2 resolution;
const float kernel = 5.;

out vec4 fragColor;
 
const float weight = 1.;
uniform bool isWidth; 

void main( )
{

    vec3 sum = vec3(0);
    float pixelSize = 1.0 / resolution.x; 
    
    // Horizontal Blur
    vec3 accumulation = vec3(0);
    vec3 weightsum = vec3(0);
    
    vec2 vector;
    for (float i = -kernel; i <= kernel; i++){
         if(isWidth == true)
            vector = vec2(pixelSize * i, 0.); 
        else
            vector = vec2(0., pixelSize * i);
        accumulation += texture(sceneColor, texCoords + vector).xyz * weight;
        weightsum += weight;
    }
    
    sum = accumulation / weightsum;
    
    fragColor = vec4(sum, 1.0);
}
`
export const gaussianVertex = `#version 300 es
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
`
export const gaussianFragment = `#version 300 es

precision highp float;

out vec4 fragColor;

in vec2 blurTextureCoords[11];

uniform sampler2D sceneColor;

void main(void){

    fragColor = vec4(0.0);
    fragColor += texture(sceneColor, blurTextureCoords[0]) * 0.0093;
    fragColor += texture(sceneColor, blurTextureCoords[1]) * 0.028002;
    fragColor += texture(sceneColor, blurTextureCoords[2]) * 0.065984;
    fragColor += texture(sceneColor, blurTextureCoords[3]) * 0.121703;
    fragColor += texture(sceneColor, blurTextureCoords[4]) * 0.175713;
    fragColor += texture(sceneColor, blurTextureCoords[5]) * 0.198596;
    fragColor += texture(sceneColor, blurTextureCoords[6]) * 0.175713;
    fragColor += texture(sceneColor, blurTextureCoords[7]) * 0.121703;
    fragColor += texture(sceneColor, blurTextureCoords[8]) * 0.065984;
    fragColor += texture(sceneColor, blurTextureCoords[9]) * 0.028002;
    fragColor += texture(sceneColor, blurTextureCoords[10]) * 0.0093;

}
`

export const bilinearUpSampling = `#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;
 
uniform sampler2D blurred;
uniform sampler2D nextSampler;
uniform float bloomIntensity;
uniform float sampleScale;

vec4 upsampleTent(vec2 texelSize)
{
    vec4 d = texelSize.xyxy  * vec4(-1, -1, +1, +1) * (sampleScale * 0.5);

    vec4 s;
    s = texture(blurred, texCoords + d.xy);
    s += texture(blurred, texCoords + d.zy);
    s += texture(blurred, texCoords + d.xw);
    s += texture(blurred, texCoords + d.zw);

    return s * (1.0 / 16.0);
}

void main(void){
    vec2 texelSize = 1.0 / vec2(textureSize(nextSampler, 0));
    fragColor = vec4(vec3(upsampleTent(texelSize) + texture(nextSampler, texCoords)), bloomIntensity);
}
`


export const compositeFragment = `
#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D blurred;
uniform sampler2D sceneColor;
uniform vec2 intensity; // [Distortion, CA] 
uniform ivec3 settings; // [Distortion, Chromatic aberration, bloom]


vec3 cA(vec2 uv){
    float amount = intensity.y * .001;
    vec3 col;
    col.r = texture( sceneColor, vec2(uv.x+amount,uv.y) ).r;
    col.g = texture( sceneColor, uv ).g;
    col.b = texture( sceneColor, vec2(uv.x-amount,uv.y) ).b;
    return col;
}
vec2 computeUV( vec2 uv, float k){
    vec2 t = uv - .5;
    float r2 = t.x * t.x + t.y * t.y;
    float f = 1. + r2 * (  .1 - k * sqrt(r2));
   
    vec2 nUv = f * t + .5;
    return nUv;    
}
 
void main(void){
    vec2 texCoords = settings.r == 1 ? computeUV( texCoords, intensity.x * .5)  : texCoords;
    vec3 b = settings.b == 1 ? texture(blurred, texCoords).rgb : vec3(0.);
    vec3 color = settings.g == 1 ? cA(texCoords): texture(sceneColor, texCoords).rgb;
    
     
    fragColor = vec4(color + b, 1.);
 
}
`