#version 300 es
precision highp float;
in vec3 vPosition;

uniform sampler2D uSampler;

out vec4 fragColor;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 sampleMapTexture(vec3 v){
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;

    return uv;
}

void main() {
    vec2 uv = sampleMapTexture(normalize(vPosition));
    vec3 color = texture(uSampler, uv.xy).rgb;
    fragColor = vec4(color, 1.0);
}
