import AXIS from "../static/AXIS";


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
 
uniform CameraMetadata{
    mat4 viewProjection; 
};

uniform mat4 transformMatrix; 
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
    gl_Position = viewProjection * transformMatrix* sc * vec4(position, 1.0);
}

`
const SIZE_DEFINITION = `#define SIZE .15`
const TRANSLATION_METHOD = `
vec3 t = translation - placement.xyz;
float len = length(placement.xyz - translation) * SIZE;
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

uniform CameraMetadata{
    mat4 viewProjection; 
    mat4 previousViewProjection;
    vec4 placement;
};

uniform mat4 transformMatrix;  
uniform vec3 translation;
uniform bool cameraIsOrthographic;
 
void main(){
    ${TRANSLATION_METHOD}
    ${SCALE_METHOD}        
    gl_Position =  viewProjection * tt * sc * vec4(position,1.0);
}
`
export const vertex = `#version 300 es
${SIZE_DEFINITION}
layout (location = 0) in vec3 position; 

uniform CameraMetadata{
    mat4 viewProjection; 
    mat4 previousViewProjection;
    vec4 placement;
};
uniform mat4 transformMatrix; 
uniform vec3 translation;
uniform bool cameraIsOrthographic;
uniform bool isSurface;

void main(){
    ${TRANSLATION_METHOD}
    if(!isSurface){
        ${SCALE_METHOD}
        tt = tt * sc;
        gl_Position =  viewProjection * tt *  vec4(position,1.0);
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
 
      
        gl_Position =  viewProjection * tt * sc *  vec4(position,1.0);
    }
}
`

export const fragment = `#version 300 es
precision highp float;

in vec4 worldSpacePosition;
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
 
uniform CameraMetadata{
    mat4 viewProjection;
    mat4 previousViewProjection;
    vec4 placement;
};

uniform mat4 transformMatrix; 
uniform vec3 translation;
uniform bool cameraIsOrthographic;

out vec2 uv;


void main(){
 
    uv = uvs; 
    vec3 t = translation - placement.xyz;
     
    float len = length(placement.xyz - translation) * SIZE;
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
    
    gl_Position =  viewProjection * tt * sc * vec4(position,1.0);   
}
`

export const fragmentRot = `#version 300 es
precision highp float;

// IN
in vec4 worldSpacePosition;
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

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;
layout (location = 4) out vec4 gDepth;
layout (location = 5) out vec4 gMeshID; 
layout (location = 6) out vec4 gNormalBase; 
layout (location = 7) out vec4 gVelocity;

void main(){
    gVelocity = vec4(0.);
    gPosition = vec4(0.);
    gNormal = vec4(0.);
    gAlbedo = vec4(0.);
    gBehaviour = vec4(0.); 
 
    gNormalBase = vec4(0.);
    gMeshID = vec4(uID, 1.);
    gDepth = vec4(0.);
}


`


export const cameraVertex = `#version 300 es

layout (location = 0) in vec3 position;
#define SIZE .15
uniform CameraMetadata{
    mat4 viewProjection; 
    mat4 previousViewProjection;
    vec4 placement;
};

uniform vec3 translation; 
uniform bool sameSize;
 
uniform mat4 transformMatrix; 
 

void main(){ 
    mat4 sc  ;
    if(sameSize){
        float len = length(placement.xyz - translation) * SIZE;
            
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
    gl_Position = viewProjection * sc * vec4(position,1.0);
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
