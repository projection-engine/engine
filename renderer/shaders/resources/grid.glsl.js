export const vertex = `#version 300 es

in vec3 position;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;


out vec3 nearPoint;
out vec3 farPoint;

out mat4 fragView;
out mat4 fragProj;

vec3 unprojectPoint(float x, float y, float z, mat4 view, mat4 projection) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(projection);
    vec4 unprojectedPoint =  viewInv * projInv * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}

void main(){
    
    fragView = viewMatrix;
    fragProj = projectionMatrix; 
    
    nearPoint = unprojectPoint(position.x, position.y, 0.0, viewMatrix, projectionMatrix).xyz;
    farPoint = unprojectPoint(position.x, position.y, 1.0, viewMatrix, projectionMatrix).xyz; 
    gl_Position = vec4(position, 1.0); 
}
`

export const fragment = `#version 300 es
precision mediump float;

const float far = 100.0;
const float near = .01; 

in vec3 nearPoint;
in vec3 farPoint;

in mat4 fragView;
in mat4 fragProj;

uniform int cameraType;
out vec4 finalColor;


vec4 grid(vec3 fragPos3D, float scale, bool darker) {
    vec2 coord = fragPos3D.xz * scale; 
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.);
    float minimumx = min(derivative.x, 1.);
    float baseColor = 0.07;
    vec4 color = vec4(baseColor, baseColor,baseColor, 1.0 - min(darker ?  line : line - .5, 1.0));
    
    float comparison = .3;
    if(cameraType == 1)
    comparison = 1.;
    // z axis
    if(fragPos3D.x > -comparison * minimumx && fragPos3D.x < comparison * minimumx){
        color.r = .0;
        color.g = .0;
        color.z = 1.0;
    }
    
    // x axis
    if(fragPos3D.z > -comparison * minimumz && fragPos3D.z < comparison * minimumz){
        color.r = 1.0;
        color.g = .0;
        color.z = .0;
    }
    return color;
}
float computeDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    return (clip_space_pos.z / clip_space_pos.w);
}
float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = fragProj * fragView * vec4(pos.xyz, 1.0);
    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0; 
    float linearDepth = (2.0 * near * far) / (far + near - clip_space_depth * (far - near)); 
    return linearDepth / far;
}

void main() {
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);
    gl_FragDepth = computeDepth(fragPos3D);
    
    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0.01, (0.5 - abs(linearDepth)));
    
    if(cameraType == 1){
        fading = .3;
        finalColor = (grid(fragPos3D * .5, 1., false)) * float(t > 0.);
    }
    else
        finalColor = (grid(fragPos3D* .2, 5., true) + grid(fragPos3D * .2, 1., false)) * float(t > 0.);
    
  
        
    finalColor.a *= fading;
}
`