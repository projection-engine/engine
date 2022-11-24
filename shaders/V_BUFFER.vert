layout (location = 0) in vec3 position;

//import(cameraUBO)

uniform mat4 previousModelMatrix;
uniform mat4 modelMatrix;

void main(){
    vec4 wPosition = modelMatrix * vec4(position, 1.0);
    previousScreenPosition = viewProjection * previousModelMatrix * vec4(position, 1.0);
    currentScreenPosition =  viewProjection * wPosition;
    gl_Position = projectionMatrix * viewMatrix * wPosition;
}
