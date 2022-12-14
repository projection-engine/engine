precision mediump  float;
uniform vec3 lightPosition;
uniform float farPlane;
in vec4 worldSpacePosition;

void main(void){
    float fromLightToFrag = length(worldSpacePosition.xyz - lightPosition);
    fromLightToFrag /= farPlane;
    gl_FragDepth = fromLightToFrag;
}