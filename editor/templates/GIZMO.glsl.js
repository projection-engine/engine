import AXIS from "../data/AXIS";


export const lineFragment = `
#version 300 es
precision lowp float;
out vec4 finalColor;
void main() {
    finalColor = vec4(1., 1., .0, 1);
}
`

export const lineVertex = `#version 300 es
layout (location = 0) in vec3 position; 
 
#define HALF 5000.
#define FULL 1000000.
uniform mat4 viewMatrix;
uniform mat4 transformMatrix; 
uniform mat4 projectionMatrix;
uniform vec3 axis; 

void main() {
 
    mat4 sc = mat4(0.);
    for ( int x = 0; x < 4; x++ )
        for ( int y = 0; y < 4; y++ )
            if ( x == y && x <= 2)
                sc[x][y] = 1.;
            else if ( x == y )
                sc[x][y] = 1.;

    if(axis.x > 0.){
           sc[0][0] = FULL;
           sc[3][0] = -HALF;
    }
    if(axis.y > 0.){
           sc[1][1] = FULL;
           sc[3][1] = -HALF;
    }
    if(axis.z > 0.){
           sc[2][2] = FULL;
           sc[3][2] = -HALF;
    } 
    gl_Position = projectionMatrix * viewMatrix * transformMatrix* sc * vec4(position, 1.0);
}

`
const SIZE_DEFINITION = `#define SIZE .15`
const TRANSLATION_METHOD = `
vec3 t = translation - camPos;
float len = length(camPos - translation) * SIZE;
mat4 tt = transformMatrix;
if(!cameraIsOrthographic){
    tt[3][0]  += t.x;
    tt[3][1]  += t.y;
    tt[3][2]  += t.z;
}
`
const SCALE_METHOD = `
mat4 sc;
for ( int x = 0; x < 4; x++ )
    for ( int y = 0; y < 4; y++ )
        if ( x == y && x <= 2)
            sc[x][y] = cameraIsOrthographic ? 1.75 : len;
        else if ( x == y )
            sc[x][y] = 1.;
        else
            sc[x][y] = 0.;

`
export const sameSizeVertex = `#version 300 es
${SIZE_DEFINITION}
layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
uniform bool cameraIsOrthographic;
 
void main(){
    ${TRANSLATION_METHOD}
    ${SCALE_METHOD}        
    gl_Position =  projectionMatrix * viewMatrix * tt * sc * vec4(position,1.0);
}
`
export const vertex = `#version 300 es
${SIZE_DEFINITION}
layout (location = 0) in vec3 position; 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
uniform bool cameraIsOrthographic;
uniform bool isSurface;

void main(){
    ${TRANSLATION_METHOD}
    if(!isSurface){
        ${SCALE_METHOD}
        tt = tt * sc;
        gl_Position =  projectionMatrix * viewMatrix * tt *  vec4(position,1.0);
    }  
    else{
        mat4 sc;
        for ( int x = 0; x < 4; x++ )
            for ( int y = 0; y < 4; y++ )
                if ( x == y && x <= 2)
                    sc[x][y] = 1000.;
                else if ( x == y )
                    sc[x][y] = 1.;
                else
                    sc[x][y] = 0.;
 
      
        gl_Position =  projectionMatrix * viewMatrix * tt * sc *  vec4(position,1.0);
    }
}
`

export const fragment = `#version 300 es
precision highp float;

in vec4 vPosition;
uniform int axis;
uniform int selectedAxis;
out vec4 fragColor; 
uniform bool isSurface;


void main(){
    vec3 color = vec3(1.);
    vec3 loc = vec3(0.0, 1.0, 0.0);
    switch (axis) {
        case ${AXIS.X}:
            color = vec3(1., 0., 0.);
            break;
        case ${AXIS.Y}:
            color = vec3(0., 1., 0.);
            break;
        case ${AXIS.Z}:
            color = vec3(0., 0., 1.);
            break;
        case ${AXIS.XZ}:
                    color = vec3(0., 0., 1.);
            
        break;
        case ${AXIS.XY}:
            color = vec3(1., 0., 0.);
        break;
        case ${AXIS.ZY}:
            color = vec3(0., 1., 0.);
        break;
        default:
            break;
    }
    float opacity = 1.;  
    if(selectedAxis == axis)
        color = vec3(1., 1., 0.);
    if(isSurface)
        opacity = .1;
    else if (axis > ${AXIS.Z} && selectedAxis != axis)
        opacity = .75;
    fragColor = vec4(color, opacity);
}
`
export const vertexRot = `#version 300 es
${SIZE_DEFINITION}
layout (location = 0) in vec3 position;
layout (location = 2) in vec2 uvs;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
uniform bool cameraIsOrthographic;

out vec2 uv;


void main(){
 
    uv = uvs; 
    vec3 t = translation - camPos;
     
    float len = length(camPos - translation) * SIZE;
     if(cameraIsOrthographic)
    	len *= .5; 
    mat4 tt = transformMatrix;
    
     
    mat4 sc;
    for ( int x = 0; x < 4; x++ )
        for ( int y = 0; y < 4; y++ )
            if ( x == y && x <= 2 )
				sc[x][y] = cameraIsOrthographic ? 1.75 : len;
            else if ( x == y )
                sc[x][y] = 1.;
            else
                sc[x][y] = 0.;  
                
		if(!cameraIsOrthographic){
			tt[3][0]  += t.x;
			tt[3][1]  += t.y;
			tt[3][2]  += t.z;
		}
    
    gl_Position =  projectionMatrix * viewMatrix * tt * sc * vec4(position,1.0);   
}
`

export const fragmentRot = `#version 300 es
precision highp float;

// IN
in vec4 vPosition;
in vec2 uv;
in vec3 normalVec;
uniform int axis;
uniform int selectedAxis;
uniform sampler2D circleSampler;
out vec4 fragColor;

void main(){
    vec4 colorS = texture(circleSampler, uv);
    float opacity = 1.;
    if(colorS.a <= .1 && axis > 0)
        opacity = .2;
    
        
    vec3 color = vec3(1.);
    switch (axis) {
        case 2:
            color = vec3(0., 0., 1.);
            break;
        case 3:
            color = vec3(0., 1., 0.);
            break;
        case 4:
            color = vec3(1., 0., 0.);
            break;
        default:
            break;
    }
  
    if(selectedAxis == axis)
        color = vec3(1., 1., 0.);
        
    fragColor = vec4(color, opacity);
}
`


export const pickFragment = `#version 300 es
precision highp float;

uniform vec3 uID;

layout (location = 0) out vec4 gDepth;
layout (location = 1) out vec4 gID;
layout (location = 2) out vec4 gUV;

void main() {
    gDepth = vec4(1.);
    gUV = vec4(1.);
    gID = vec4(uID, 1.);
}
`


export const cameraVertex = `#version 300 es

layout (location = 0) in vec3 position;
#define SIZE .15

uniform vec3 translation;
uniform vec3 cameraPosition;
uniform bool sameSize;
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
 

void main(){ 
    mat4 sc  ;
    if(sameSize){
        float len = length(cameraPosition - translation) * SIZE;
            
        for ( int x = 0; x < 4; x++ )
            for ( int y = 0; y < 4; y++ )
                if ( x == y && x <= 2)
                    sc[x][y] = len;
                else if ( x == y )
                    sc[x][y] = 1.;
                else
                    sc[x][y] = 0.;
        sc = transformMatrix * sc;      
    }
    else
        sc = transformMatrix;
    gl_Position = projectionMatrix * viewMatrix * sc * vec4(position,1.0);
}
`

export const cameraFragment = `#version 300 es
precision highp float;

 
uniform bool highlight; 
out vec4 fragColor;


void main(){
    vec3 color = vec3(0., 0., 1.);

    if(highlight)
        color = vec3(1., 1., 0.);

    
    fragColor = vec4(color, .95);
}
`
