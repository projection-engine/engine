export const vertex = `#version 300 es

layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

void main(){
    gl_Position = projectionMatrix * viewMatrix * (transformMatrix *   vec4(position, 1.0));
}
`

export const fragment = `#version 300 es
precision highp float;

// IN
in vec4 vPosition;
in vec3 normalVec;
uniform int axis;
uniform int selectedAxis;
 
 
out vec4 fragColor;



void main(){
    
    vec3 color = vec3(1.);
    
    // axis === 0 -> center
    // axis === 1 -> x
    // axis === 2 -> y
    // axis === 3 -> z
    
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