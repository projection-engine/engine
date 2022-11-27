layout (location = 0) in vec3 position;


uniform mat4 viewProjection;
uniform mat4 previousModelMatrix;
uniform mat4 modelMatrix;

out vec4 previousScreenPosition;
out vec4 currentScreenPosition;

void main(){
    vec4 wPosition = modelMatrix * vec4(position, 1.0);
    previousScreenPosition = viewProjection * previousModelMatrix * vec4(position, 1.0);
    currentScreenPosition =  viewProjection * wPosition;
    gl_Position = viewProjection * wPosition;
}
