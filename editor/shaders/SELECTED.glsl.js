export const vertex = `#version 300 es

layout (location = 0) in vec3 position; 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

void main(){              
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
}
`

export const fragment = `#version 300 es
precision mediump float;
uniform int meshIndex;
out vec4 fragColor;

void main(){ 
    if(meshIndex == 0)
        fragColor = vec4(1.);
    else
        fragColor = vec4(vec3(.5), 1.);
}
`

export const vertexSilhouette = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoords;
 
void main() {
    texCoords = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}`

// THANKS https://stackoverflow.com/questions/53897949/opengl-object-outline
export const fragmentSilhouette = `#version 300 es
precision mediump float;
uniform sampler2D silhouette;

in vec2 texCoords;
out vec4 fragColor;

void main()
{
    float initialColor = texture(silhouette, texCoords).x; 
    if (initialColor > 0.)
    {
        vec2 size = 3. / vec2(textureSize(silhouette, 0));
        for (int i = -1; i <= +1; i++)
        {
            for (int j = -1; j <= +1; j++)
            {
                if (i == 0 && j == 0){
                    continue;
                }
                
                vec2 offset = vec2(i, j) * size;
                float currentColor = texture(silhouette, texCoords + offset).x;
                if (currentColor == 0. || initialColor == .5 && currentColor != initialColor) {
                    if(initialColor != .5)
                        fragColor = vec4(1., .27, 0., 1.);
                    else
                        fragColor = vec4(1.,  .5, 0., 1.);
                    return;
                }
            }
        }
    }
    discard;
}
`