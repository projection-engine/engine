layout (location = 0) in vec3 position;



uniform mat4 previousViewProjection;
uniform mat4 previousModelMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewProjection;

out vec4 previousScreenPosition;
out vec4 currentScreenPosition;

void main(){
    vec4 wPosition = modelMatrix * vec4(position, 1.0);
    previousScreenPosition = previousViewProjection * previousModelMatrix * vec4(position, 1.0);
    currentScreenPosition =  viewProjection * wPosition;
    gl_Position = viewProjection * wPosition;
}
