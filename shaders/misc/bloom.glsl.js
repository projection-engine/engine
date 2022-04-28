export const brightFragment = `#version 300 es

precision lowp float;

in vec2 vTexcoord;
uniform sampler2D sceneColor;
uniform float threshold;
out vec4 fragColor;


void main(){
    vec4 color = texture(sceneColor, vTexcoord);
    float brightness = (color.r  * 0.2126 ) + (color.g  * 0.7152 ) +  (color.b * 0.0722 );
    if (brightness > threshold)
        fragColor = color;
       
    else 
        fragColor = vec4(0.,0.,0.,1.);
   
     
}`

export const blurBox = `#version 300 es

precision mediump float;

in vec2 vTexcoord;
uniform sampler2D sceneColor;
uniform vec2 resolution;
out vec4 fragColor;
const float kernel = 7.0;
const float weight = 1.0;
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
        accumulation += texture(sceneColor, vTexcoord + vector).xyz * weight;
        weightsum += weight;
    }
    
    sum = accumulation / weightsum;
    
    fragColor = vec4(sum, 1.0);
}
`
export const blurVertex = `#version 300 es
layout (location = 0) in vec3 position;

 
uniform vec2 resolution;
uniform bool isWidth; 

out vec2 blurTextureCoords[11];

void main() {
    vec2 texCoord = (position.xy) * 0.5 + 0.5;
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
        blurTextureCoords[i + 5] =   texCoord + vector;
     }
     
    gl_Position = vec4(position, 1.0);
}    
`
export const blur = `#version 300 es

precision mediump float;

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
in vec2 vTexcoord;

uniform vec2 resolution;
uniform sampler2D blurred;
uniform sampler2D nextSampler;
uniform float bloomIntensity;
 

vec4 upsampleTent(vec2 texelSize, vec4 sampleScale)
{
    vec4 d = vec4(texelSize.x, texelSize.y, texelSize.x, texelSize.y) * vec4(1.0, 1.0, -1.0, 0.0) * sampleScale;

    vec4 s;
    s =  texture( blurred, vTexcoord - d.xy);
    s += texture( blurred, vTexcoord - d.wy) * 2.0;
    s += texture( blurred, vTexcoord - d.zy);

    s += texture( blurred, vTexcoord - d.zw) * 2.0;
    s += texture( blurred, vTexcoord) * 4.0;
    s += texture( blurred, vTexcoord - d.xw) * 2.0;

    s += texture( blurred, vTexcoord - d.zy);
    s += texture( blurred, vTexcoord - d.wy) * 2.0;
    s += texture( blurred, vTexcoord - d.xy);

    return s * (1.0 / 16.0);
}

void main(void){
    fragColor = vec4(vec3(upsampleTent(1./resolution, vec4(2.)) + texture(nextSampler, vTexcoord)), bloomIntensity);
}
`


export const compositeFragment = `
#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 vTexcoord;

uniform vec2 resolution;
uniform sampler2D blurred;
uniform sampler2D sceneColor;
uniform float gamma;
uniform float exposure;
     
            
 
vec3 aces(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
void main(void){
    vec3 b = aces(texture(blurred, vTexcoord).rgb);
 
    vec3 color = texture(sceneColor, vTexcoord).rgb + b;

    color = vec3(1.0) - exp(-color * exposure);
    color = pow(color, vec3(1.0/gamma));       
    fragColor = vec4(color, 1.);
}
`