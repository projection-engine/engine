precision lowp float;

in vec2 texCoords;
uniform sampler2D image;
out vec4 fragColor;

void main(){
    vec4 color = texture(image, texCoords);
    if(color.a < 1.) discard;
    fragColor = vec4(color.rgb, 1.);
}