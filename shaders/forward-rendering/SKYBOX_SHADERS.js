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
in vec2 texCoords;
uniform sampler2D uTexture;
out vec4 finalColor;

void main(void){
    finalColor = vec4(texture(uTexture, texCoords).rgb, 1.);
}
`