export const vertex = `#version 300 es
#define SIZE .2
layout (location = 1) in vec3 position;
 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
void main(){
    vec3 t = translation - camPos;
     
    float len = length(camPos - translation) * SIZE; 
    mat4 tt = transformMatrix;
    
     
    mat4 sc;
    for ( int x = 0; x < 4; x++ )
        for ( int y = 0; y < 4; y++ )
            if ( x == y && x <= 2 )
                sc[x][y] = len;
            else if ( x == y )
                sc[x][y] = 1.;
            else
                sc[x][y] = 0.;

        
    tt[3][0]  += t.x;
    tt[3][1]  += t.y;
    tt[3][2]  += t.z;
    gl_Position =  projectionMatrix * viewMatrix * tt * sc * vec4(position,1.0);
     
 
}
`

export const fragment = `#version 300 es
precision highp float;

in vec4 vPosition;
uniform int axis;
uniform int selectedAxis;
out vec4 fragColor;

void main(){
    vec3 color = vec3(1.);
    vec3 loc = vec3(0.0, 1.0, 0.0);
    switch (axis) {
        case 1:
            color = vec3(1., 0., 0.);
   
            break;
        case 2:
            color = vec3(0., 1., 0.);
            break;
        case 3:
            color = vec3(0., 0., 1.);
            break;
        default:
            break;
    }
  
    if(selectedAxis == axis)
        color = vec3(1., 1., 0.);
    
    fragColor = vec4(color, 1.);
}
`
export const vertexRot = `#version 300 es

#define SIZE .2
layout (location = 1) in vec3 position;
layout (location = 3) in vec2 uvs;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;

out vec2 uv;


void main(){
 
    uv = uvs; 
    vec3 t = translation - camPos;
     
    float len = length(camPos - translation) * SIZE; 
    mat4 tt = transformMatrix;
    
     
    mat4 sc;
    for ( int x = 0; x < 4; x++ )
        for ( int y = 0; y < 4; y++ )
            if ( x == y && x <= 2 )
                sc[x][y] = len;
            else if ( x == y )
                sc[x][y] = 1.;
            else
                sc[x][y] = 0.;  
                
    tt[3][0]  += t.x;
    tt[3][1]  += t.y;
    tt[3][2]  += t.z;
    
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
        opacity = .3;
    
        
    vec3 color = vec3(1.);
    switch (axis) {
        case 1:
            color = vec3(1., 0., 0.);
            break;
        case 2:
            color = vec3(0., 1., 0.);
            break;
        case 3:
            color = vec3(0., 0., 1.);
            break;
        default:
            break;
    }
  
    if(selectedAxis == axis)
        color = vec3(1., 1., 0.);
        
    fragColor = vec4(color, opacity);
}
`

export const shadedVertex = `#version 300 es

layout (location = 1) in vec3 position;
 layout (location = 2) in vec3 normal;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

out vec3 normalVec;

void main(){
   normalVec = normalize(normal);
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position,1.0);
}
`

export const shadedFragment = `#version 300 es
precision highp float;

in vec4 vPosition;
in vec3 normalVec;

uniform int axis;
uniform int selectedAxis;
out vec4 fragColor;


void main(){
    vec3 color = vec3(1.);
    vec3 loc = vec3(0.0, 1.0, 0.0);
    switch (axis) {
        case 1:
            color = vec3(1., 0., 0.);
   
            break;
        case 2:
            color = vec3(0., 1., 0.);
            break;
        case 3:
            color = vec3(0., 0., 1.);
            break;
        default:
            break;
    }
  
    if(selectedAxis == axis)
        color = vec3(1., 1., 0.);
    
    float shadingIntensity = dot(normalVec, vec3(0., 5.0, 0.0));
    float brightness = max(0.5, shadingIntensity);
    color = color * brightness;
    
    fragColor = vec4(color, .95);
}
`

export const selectedVertex = `#version 300 es

layout (location = 1) in vec3 position;
 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

void main(){
    mat4 sc;
    for ( int x = 0; x < 4; x++ )
        for ( int y = 0; y < 4; y++ )
            if ( x == y && x <= 2 )
                sc[x][y] = 1.001;
            else if ( x == y )
                sc[x][y] = 1.;
            else
                sc[x][y] = 0.;  
                
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * sc * vec4(position,1.0);
}
`
export const selectedFragment = `#version 300 es
precision lowp float;

uniform int index;
out vec4 fragColor;

void main(){
    if(index == 0)
        fragColor = vec4(1., 1., 0., .7);
    else
        fragColor = vec4(1., 0.2, 0., 1.);
}
`