export const vertex = `#version 300 es

layout (location = 0) in vec3 Position;

out vec2 texCoords;

void main()
{
    gl_Position = vec4(Position, 1.0);
    texCoords = Position.xy * 0.5 + 0.5;
}
`
// THANKS TO https://theorangeduck.com/page/pure-depth-ssao
export const fragment = `#version 300 es


precision highp float;

#define T  1.
#define B  0.2
#define A  0.0075
#define F  0.000001
#define R  0.0002

in vec2 texCoords;
uniform sampler2D depthSampler;
uniform sampler2D randomSampler;
uniform mat3 settings;

out vec4 outColor;

vec3 normal_from_depth(float depth, vec2 texcoords) {
  
  const vec2 offset1 = vec2(0.0,0.001);
  const vec2 offset2 = vec2(0.001,0.0);
  
  float depth1 = texture(depthSampler, texcoords + offset1).r;
  float depth2 = texture(depthSampler, texcoords + offset2).r;
  
  vec3 p1 = vec3(offset1, depth1 - depth);
  vec3 p2 = vec3(offset2, depth2 - depth);
  
  vec3 normal = cross(p1, p2);
  normal.z = -normal.z;
  
  return normalize(normal);
}


void main()
{
  float total_strength = T * settings[0][0];
  float base  = B * settings[0][1];
  float area  =A *  settings[0][2];
  float falloff  =F *  settings[1][0];
  float radius  = R * settings[1][2];
  const int samples = 16;
  
  
  vec3 sample_sphere[samples] = vec3[samples](
      vec3( 0.5381, 0.1856,-0.4319), vec3( 0.1379, 0.2486, 0.4430),
      vec3( 0.3371, 0.5679,-0.0057), vec3(-0.6999,-0.0451,-0.0019),
      vec3( 0.0689,-0.1598,-0.8547), vec3( 0.0560, 0.0069,-0.1843),
      vec3(-0.0146, 0.1402, 0.0762), vec3( 0.0100,-0.1924,-0.0344),
      vec3(-0.3577,-0.5301,-0.4358), vec3(-0.3169, 0.1063, 0.0158),
      vec3( 0.0103,-0.5869, 0.0046), vec3(-0.0897,-0.4940, 0.3287),
      vec3( 0.7119,-0.0154,-0.0918), vec3(-0.0533, 0.0596,-0.5411),
      vec3( 0.0352,-0.0631, 0.5460), vec3(-0.4776, 0.2847,-0.0271)
  );
  
  vec3 random = normalize( texture(randomSampler, texCoords * 4.0).rgb );
  
  float depth = texture(depthSampler, texCoords).r;
 
  vec3 position = vec3(texCoords, depth);
  vec3 normal = normal_from_depth(depth, texCoords);
  
  float radius_depth = radius/depth;
  float occlusion = 0.0;
  for(int i=0; i < samples; i++) {
  
    vec3 ray = radius_depth * reflect(sample_sphere[i], random);
    vec3 hemi_ray = position + sign(dot(ray,normal)) * ray;
    
    float occ_depth = texture(depthSampler, clamp(hemi_ray.xy, 0., 1.)).r;
    float difference = depth - occ_depth;
    
    occlusion += step(falloff, difference) * (1.0-smoothstep(falloff, area, difference));
  }
  
  float ao = 1.0 - total_strength * occlusion * (1.0 / float(samples));
  
  
  
  outColor = vec4(vec3(clamp(ao + base, 0., 1.)), 1.);
}
`
export const fragmentBlur = `#version 300 es

precision highp float;
out vec4 fragColor;
in vec2 texCoords;
uniform sampler2D aoSampler;

void main() 
{
    vec2 texelSize = 1.0 / vec2(textureSize(aoSampler, 0));
    float result = 0.0;
    for (int x = -2; x < 2; ++x) 
    {
        for (int y = -2; y < 2; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(aoSampler, texCoords + offset).r;
        }
    }
    fragColor = vec4(vec3(result / (4.0 * 4.0)), 1.);
}  

`
