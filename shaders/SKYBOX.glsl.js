export const vertex = `
layout (location = 0) in vec3 position;
layout (location = 2) in vec2 uvTexture;
//import(cameraUBO)

uniform mat4 skyboxProjectionMatrix;

out highp vec2 texCoords;
void main(){
    texCoords = uvTexture;
    
    mat4 m = viewMatrix ;
   m[3][0]  = 0.0;
   m[3][1]  = 0.0;
   m[3][2]  = 0.0;

    gl_Position = skyboxProjectionMatrix * m * vec4(position, 1.0);
}
`
export const fragment = `
precision mediump float;
in highp vec3 texCoords;
uniform samplerCube uTexture;
out vec4 finalColor;
void main(void){
    finalColor = vec4(texture(uTexture, texCoords).rgb, 1.);
}
`

// export const generationFragment = `
// precision highp float;
// in vec3 worldSpacePosition;
//
// uniform sampler2D uSampler;
//
// out vec4 fragColor;
//
// const vec2 invAtan = vec2(0.1591, 0.3183);
// vec2 sampleMapTexture(vec3 v){
//     vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
//     uv *= invAtan;
//     uv += 0.5;
//
//     return uv;
// }
//
// void main() {
//     vec2 uv = sampleMapTexture(normalize(worldSpacePosition));
//     vec3 color = texture(uSampler, uv.xy).rgb;
//     fragColor = vec4(color, 1.0);
// }
// `