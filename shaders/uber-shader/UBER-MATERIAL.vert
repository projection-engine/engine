layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

uniform mat4 viewProjection;
uniform mat4 modelMatrix;

uniform mat4 skyProjectionMatrix;
uniform mat3 materialAttributes;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform bool isSpritePass;
uniform vec3 cameraPosition;
uniform vec3 scale;

out vec3 normalVec;

out vec3 worldSpacePosition;
out vec2 texCoords;
out mat3 matAttr;

void main(){

    matAttr = materialAttributes;

    if(!isSpritePass) {
        texCoords = uvTexture;
        mat4 M = modelMatrix;
        bool isSky = materialAttributes[1][1] == 1.;
        if (isSky) {
            M[3][0] = 0.;
            M[3][1] = 0.;
            M[3][2] = 0.;
        }

        vec4 wPosition = M * vec4(position, 1.0);
        worldSpacePosition = wPosition.xyz;
        normalVec = normalize(mat3(M) * normal);

        if (isSky) {
            mat4 V = viewMatrix;
            V[3][0] = 0.;
            V[3][1] = 0.;
            V[3][2] = 0.;
            gl_Position = skyProjectionMatrix * V * wPosition;
        }
        else
        gl_Position = viewProjection * wPosition;
    }else{
            bool alwaysFaceCamera = materialAttributes[2][0] == 1.;
            bool keepSameSize = materialAttributes[2][1] == 1.;


            mat4 m =  viewMatrix * modelMatrix;
            if(alwaysFaceCamera){
                m[0][0] = scale.x;
                m[1][1] = scale.y;
                m[2][2] = scale.z;

                m[0][1]     = 0.0;
                m[0][2]     = 0.0;
                m[0][3]     = 0.0;
                m[1][0]     = 0.0;
                m[1][2]     = 0.0;
                m[1][3]     = 0.0;
                m[2][0]     = 0.0;
                m[2][1]     = 0.0;
                m[2][3]     = 0.0;
            }

            if(keepSameSize){
                vec3 translation = vec3(modelMatrix[3]);
                float len = length(cameraPosition.xyz - translation);
                mat4 sc;
                for ( int x = 0; x < 4; x++ )
                for ( int y = 0; y < 4; y++ )
                if ( x == y && x <= 2 )
                sc[x][y] = len * scale[x];
                else if ( x == y )
                sc[x][y] = 1.;
                else
                sc[x][y] = 0.;
                m = m * sc;
            }
            texCoords = position.xy * .5 + .5;
            worldSpacePosition = vec3(modelMatrix * vec4(position, 1.0));
            normalVec = normalize(normal);

            gl_Position = projectionMatrix * m * vec4(position, 1.0);

    }
}
