
precision mediump float;

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform float threshold;
out vec4 fragColor;


void main(){
    vec4 color = texture(sceneColor, texCoords);
    float brightness = (color.r  * 0.2126 ) + (color.g  * 0.7152 ) +  (color.b * 0.0722 );
    if (brightness > threshold)
    fragColor = color;

    else
    fragColor = vec4(0.,0.,0.,1.);


}