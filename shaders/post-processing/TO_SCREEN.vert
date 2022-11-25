precision lowp float;

in vec2 texCoords;
uniform sampler2D image;
out vec4 fragColor;

void main(){
    fragColor = vec4(texture(image, texCoords).rgb, 1.);
}