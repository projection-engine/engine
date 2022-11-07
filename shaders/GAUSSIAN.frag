#version 300 es
precision highp float;
// BIG THANKS TO https://stackoverflow.com/questions/64837705/opengl-blurring
in vec2 texCoords;
uniform sampler2D sceneColor;
uniform vec2 resolution;
uniform float blurRadius;

out vec4 fragColor;
void main(void){
    float xs = resolution.x;
    float ys = resolution.y;

    float x;
    float y;
    float xx;
    float yy;
    float rr=pow(blurRadius, 2.);
    float dx;
    float dy;
    float w;
    float w0;
    w0=0.3780/pow(blurRadius, 1.975);
    vec2 p;
    vec4 col=vec4(0.0, 0.0, 0.0, 0.0);
    for (dx=1.0/xs, x=-blurRadius, p.x=texCoords.x+(x*dx);x<=blurRadius;x++, p.x+=dx){
        xx=x*x;
        for (dy=1.0/ys, y=-blurRadius, p.y=texCoords.y+(y*dy);y<=blurRadius;y++, p.y+=dy){
            yy=y*y;
            if (xx+yy<=rr){
                w=w0*exp((-xx-yy)/(2.0*rr));
                col+=texture(sceneColor, p)*w;
            }
        }
    }

    fragColor = col;
}