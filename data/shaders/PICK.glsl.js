export const sameSizeVertex = `#version 300 es
#define SIZE .15
layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 camPos;
uniform vec3 translation;
uniform bool cameraIsOrthographic;

void main(){
    vec3 t = translation - camPos;

		float len = length(camPos - translation) * SIZE;
		mat4 tt = transformMatrix;
		mat4 sc;
		for ( int x = 0; x < 4; x++ )
			for ( int y = 0; y < 4; y++ )
				if ( x == y && x <= 2)
					sc[x][y] = cameraIsOrthographic ? 1.75 : len;
				else if ( x == y )
					sc[x][y] = 1.;
				else
					sc[x][y] = 0.;
		if(!cameraIsOrthographic){
			tt[3][0]  += t.x;
			tt[3][1]  += t.y;
			tt[3][2]  += t.z;
		}
		gl_Position =  projectionMatrix * viewMatrix * tt * sc * vec4(position,1.0);
}
`

export const vertex = `#version 300 es
layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 transformMatrix;

void main() {

        gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
  
}
`
export const fragment =  `#version 300 es
precision highp float;

uniform vec4 uID;

out vec4 fragColor;

void main() {
    fragColor = uID;
}
`
