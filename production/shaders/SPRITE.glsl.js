
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
    
    texCoord = position.xy * .5 + .5;
    mat4 m =  viewMatrix * transformationMatrix;  
    
    if(alwaysFaceCamera){ 
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
    
    gl_Position = projectionMatrix * m * vec4(position, 1.0);
}
`


export default {
    vertex,
    fragment
}