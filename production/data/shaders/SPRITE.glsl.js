const BODY = `
#define SIZE .2
uniform vec3 cameraPosition;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix; 
uniform vec2 attributes; // [ alwaysFaceCamera, keepSameSize ]
uniform vec3 scale;

out vec2 texCoord;

void main(){
    bool alwaysFaceCamera = attributes.x == 1.; 
    bool keepSameSize = attributes.y == 1.;
    
    texCoord = (position.xy) * 0.5 + 0.5;
    mat4 m =  transformationMatrix;    
 
    
    if(alwaysFaceCamera){
        m = viewMatrix * m;

        m[0][0] = scale[0];
        m[1][1] = scale[1];
        m[2][2] = scale[2];
        
        m[0][1]  = 0.0;
        m[0][2]  = 0.0;
        m[0][3]  = 0.0;
        m[1][0] = 0.0;
        m[1][2] =0.0;
        m[1][3]  = 0.0;
        m[2][0] = 0.0;
        m[2][1] = 0.0;
        m[2][3]  = 0.0;
    }

    if(!alwaysFaceCamera)
          m = viewMatrix * m;
    if(keepSameSize){
        vec3 translation = vec3(transformationMatrix[3]);
        float len = length(cameraPosition - translation) * SIZE; 
    	mat4 sc;
		for ( int x = 0; x < 4; x++ )
			for ( int y = 0; y < 4; y++ )
				if ( x == y && x <= 2 )
					sc[x][y] = len;
				else if ( x == y )
					sc[x][y] = 1.;
				else
					sc[x][y] = 0.;  
        m = m * sc;
    }
    


    vec4 transformed =projectionMatrix * m * vec4(position, 1.0);
    transformed /= transformed.w;

    gl_Position = vec4(transformed.xyz, 1.0);
}
`
export const fragment = `#version 300 es

precision mediump float;
in vec2 texCoord;

uniform sampler2D iconSampler;
out vec4 finalColor;

void main()
{
    vec4 color = texture(iconSampler, texCoord).rgba;
    if(color.a <= .1)
        discard;
    else
        finalColor = vec4(color);
}
`
export const vertex = `#version 300 es 
layout (location = 0) in vec3 position; 
uniform mat4 transformationMatrix;
 
${BODY}
`
export const vertexInstanced = `#version 300 es
layout (location = 0) in vec3 position;
layout (location = 1) in mat4 transformationMatrix;

${BODY}
`


// TODO - REMOVE THIS
export const selectedVertex = `#version 300 es

#define SIZE .2
layout (location = 0) in vec3 position; 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
uniform float iconSize; 
uniform bool cameraIsOrthographic;

uniform bool forceAsIcon;
out vec2 uv;


void main(){
    uv = (position.xy) * 0.5 + 0.5;
    vec3 t = vec3(0.);
    if(forceAsIcon == false)
    	t = translation - camPos;
   
    float len = length(camPos - translation) * SIZE; 
    mat4 tt = transformMatrix;

	if(!cameraIsOrthographic){
		tt[3][0]  += t.x;
		tt[3][1]  += t.y;
		tt[3][2]  += t.z;
    }
    
    mat4 m =  viewMatrix * tt;

    float d = forceAsIcon ? .75 * iconSize : cameraIsOrthographic ? .15 : .3; 
 
    m[0][0]  = d;
    m[0][1]  = 0.0;
    m[0][2]  = 0.0;
    m[0][3]  = 0.0;

    m[1][0] = 0.0;
    m[1][1] = d;
    m[1][2] = 0.0;
    m[1][3]  = 0.0;

    m[2][0] = 0.0;
    m[2][1] = 0.0;
    m[2][2] = d;
    m[2][3]  = 0.0;

	vec4 transformed; 
	if(forceAsIcon == false){
		mat4 sc;
		for ( int x = 0; x < 4; x++ )
			for ( int y = 0; y < 4; y++ )
				if ( x == y && x <= 2 )
					sc[x][y] = cameraIsOrthographic ? 1.75 : forceAsIcon ? 1. :  len;
				else if ( x == y )
					sc[x][y] = 1.;
				else
					sc[x][y] = 0.;  
		transformed =projectionMatrix * m  * sc * vec4(position, 1.0);
    }
    else{
    	transformed = projectionMatrix * m * vec4(position, 1.0);
	}
    transformed /= transformed.w;

    gl_Position = vec4(transformed.xyz, 1.0);   
}
`


export const selectedFragment = `#version 300 es
precision highp float;

in vec2 uv; 
uniform sampler2D sampler;
out vec4 fragColor;
uniform bool forceAsIcon;
void main(){
	vec4 color = texture(sampler, uv);
	if(color.a == 0. || length(color) <= .1)
		discard;
	else	
		fragColor = vec4(forceAsIcon == true ? vec3(1., 1., 0.) : color.rgb, 1.);
}
`


export default {
    vertex,
    vertexInstanced,
    fragment
}