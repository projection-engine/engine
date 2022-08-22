export const fragment = `#version 300 es
precision mediump float;

in vec3 normalVec;
in vec3 tangent;
in vec3 bitangent;
in vec4 vPosition;

in vec2 texCoord;
in mat3 toTangentSpace;

uniform sampler2D aoSampler;
uniform int shadingModel;

out vec4 fragColor;

float linearize_Z(float depth){ 
    float near = .1;
    float far = 1000.;
    return (2.*near ) / (far + near - depth*(far -near)) ;
}

void main(){
    vec3 color = vec3(0.); 
    
    switch (shadingModel) {
        case 0:
            color = normalVec;
            break;
        case 1: 
            color = tangent;
            break;
        case 2:
            color = vec3(linearize_Z(gl_FragCoord.z));
            break;
        case 3:
            color = vec3(texture(aoSampler, texCoord).r);
            break;
        case 4:
            color = bitangent;
            break;
       	case 5:
            color = vec3(texCoord, 1.);
            break;
	   	default:
	   		float dotP = min(1., max(0.5, dot(vec3(0., 10000., 0), normalVec)));
			color = vec3(.5) * dotP;
			break;
    }
  
    fragColor = vec4(color, 1.);
}
`



