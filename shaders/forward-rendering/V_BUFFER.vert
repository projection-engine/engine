layout (location = 0) in vec3 position;

//import(cameraProjectionInfo)

uniform mat4 viewProjection;
uniform mat4 previousViewProjection;
uniform mat4 previousModelMatrix;
uniform mat4 modelMatrix;
uniform mat4 metadata;

uniform mat4 viewMatrix;
uniform vec3 cameraPlacement;

out vec4 previousScreenPosition;
out vec4 currentScreenPosition;
out mat4 entityMetadata;

out float depthFunc;

void main() {
    entityMetadata = metadata;
    bool isSprite = metadata[1][1] == 1.;


    if (isSprite) {
        bool alwaysFaceCamera = metadata[2][0] == 1.;
        bool keepSameSize = metadata[2][1] == 1.;
        vec3 scale = vec3(metadata[3]);

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
            float len = length(cameraPlacement - translation);
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

        gl_Position = projectionMatrix * m * vec4(position, 1.0);
        previousScreenPosition = gl_Position;
        currentScreenPosition = gl_Position;
    }
    else {
        vec4 wPosition = modelMatrix * vec4(position, 1.0);
        previousScreenPosition = previousViewProjection * previousModelMatrix * vec4(position, 1.0);
        currentScreenPosition = viewProjection * wPosition;

        gl_Position = viewProjection * wPosition;
    }
    depthFunc = logDepthFC;
}
