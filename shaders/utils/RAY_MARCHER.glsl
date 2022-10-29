// THANKS TO https://imanolfotia.com/blog/1
uniform vec3 rayMarchSettings; // maxSteps, numBinarySearchSteps, DEPTH_THRESHOLD
uniform mat4 projection;
uniform mat4 viewMatrix;
uniform sampler2D previousFrame;

float Metallic;
out vec4 outColor;

vec3 getViewPosition(vec2 coords){
    return  vec3(viewMatrix * textureLod(gPosition, coords, 2.));
}

vec3 BinarySearch(inout vec3 dir, inout vec3 hitCoord, inout float dDepth)
{
    float depth;
    int numBinarySearchSteps = int(rayMarchSettings.y);
    vec4 projectedCoord;

    for(int i = 0; i < numBinarySearchSteps; i++)
    {
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

        depth = getViewPosition(projectedCoord.xy).z;
        dDepth = hitCoord.z - depth;
        dir *= 0.5;
        if(dDepth > 0.0)
        hitCoord += dir;
        else
        hitCoord -= dir;
    }

    projectedCoord = projection * vec4(hitCoord, 1.0);
    projectedCoord.xy /= projectedCoord.w;
    projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

    return vec3(projectedCoord.xy, depth);
}

vec4 RayMarch(vec3 dir, inout vec3 hitCoord, out float dDepth, float stepSize){
    dir *= stepSize;
    float depth;
    int steps;
    vec4 projectedCoord;
    int maxSteps = int(rayMarchSettings.x);
    float depthThreshold = rayMarchSettings.z;

    for(int i = 0; i < maxSteps; i++)   {
        hitCoord += dir;
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;

        depth = getViewPosition(projectedCoord.xy).z;
        if(depth > 1000.0)
        continue;

        dDepth = hitCoord.z - depth;

        if((dir.z - dDepth) < depthThreshold){
            if(dDepth <= 0.0)
            {
                vec4 Result;
                Result = vec4(BinarySearch(dir, hitCoord, dDepth), 1.0);

                return Result;
            }
        }

        steps++;
    }


    return vec4(projectedCoord.xy, depth, 0.0);
}

vec3 hash(vec3 a)
{
    a = fract(a * vec3(.8) );
    a += dot(a, a.yxz + 19.19);
    return fract((a.xxy + a.yxx)*a.zyx);
}