export const vertex = `#version 300 es

precision highp float;
layout(location = 0) in vec2 a_point_position;

@import(lvpCommon)

#define PI 3.1415926
#define DEG_TO_RAD PI / 180.

uniform int u_texture_size;
uniform int u_rsm_size;
uniform vec3 u_light_direction;

uniform sampler2D u_rsm_flux;
uniform sampler2D u_rsm_world_positions;
uniform sampler2D u_rsm_world_normals;

struct RSMTexel 
{
    vec3 world_position;
    vec3 world_normal;
    vec4 flux;
};

out RSMTexel v_rsm_texel;
out float surfel_area;

RSMTexel getRSMTexel(ivec2 texCoord) 
{
    RSMTexel texel;
    texel.world_normal = texelFetch(u_rsm_world_normals, texCoord, 0).xyz;

    // Displace the position by half a normal
    texel.world_position = texelFetch(u_rsm_world_positions, texCoord, 0).xyz + 0.5 * texel.world_normal;
    texel.flux = texelFetch(u_rsm_flux, texCoord, 0);
    return texel;
}

// Get ndc texture coordinates from gridcell
vec2 getRenderingTexCoords(ivec3 gridCell)
{
    float f_texture_size = float(u_texture_size);
    // Displace int coordinates with 0.5
    vec2 tex_coords = vec2((gridCell.x % u_texture_size) + u_texture_size * gridCell.z, gridCell.y) + vec2(0.5);
    // Get ndc coordinates
    vec2 ndc = vec2((2.0 * tex_coords.x) / (f_texture_size * f_texture_size), (2.0 * tex_coords.y) / f_texture_size) - vec2(1.0);
    return ndc;
}

// Sample from light
float calculateSurfelAreaLight(vec3 lightPos)
{
    float fov = 90.; //TODO fix correct fov
    float aspect = float(u_rsm_size / u_rsm_size);
    float tan_fov_x_half = tan(0.5 * fov * DEG_TO_RAD);
    float tan_fov_y_half = tan(0.5 * fov * DEG_TO_RAD) * aspect;

    return (4.0 * lightPos.z * lightPos.z * tan_fov_x_half * tan_fov_y_half) / float(u_rsm_size * u_rsm_size);
}

void main()
{
    ivec2 rsm_tex_coords = ivec2(gl_VertexID % u_rsm_size, gl_VertexID / u_rsm_size);
    v_rsm_texel = getRSMTexel(rsm_tex_coords);
    ivec3 v_grid_cell = getGridCelli(v_rsm_texel.world_position, u_texture_size);

    vec2 tex_coord = getRenderingTexCoords(v_grid_cell);

    gl_PointSize = 1.0;
    gl_Position = vec4(tex_coord, 0.0, 1.0);

    surfel_area = calculateSurfelAreaLight(u_light_direction);
}

`

export const fragment = `#version 300 es

precision highp float;

@import(lvpCommon)

layout(location = 0) out vec4 o_red_color;
layout(location = 1) out vec4 o_green_color;
layout(location = 2) out vec4 o_blue_color;

uniform vec3 u_light_direction;

struct RSMTexel {
    vec3 world_position;
    vec3 world_normal;
    vec4 flux;
};

in RSMTexel v_rsm_texel;
in float surfel_area;

float calculateBlockingPotencial(vec3 dir, vec3 normal)
{
    return clamp((surfel_area * clamp(dot(normal, dir), 0.0, 1.0)) / (CELLSIZE * CELLSIZE), 0.0, 1.0);//It is probability so 0.0 - 1.0
}

void main()
{
    //Discard pixels with really small normal
    if (length(v_rsm_texel.world_normal) < 0.01) {
        discard;
    }

    vec3 light_dir = normalize(u_light_direction - v_rsm_texel.world_position);//Both are in world space
    float blocking_potencial = calculateBlockingPotencial(light_dir, v_rsm_texel.world_normal);

    vec4 SH_coeffs = evalCosineLobeToDir(v_rsm_texel.world_normal) * blocking_potencial;
    vec4 shR = SH_coeffs * v_rsm_texel.flux.r;
    vec4 shG = SH_coeffs * v_rsm_texel.flux.g;
    vec4 shB = SH_coeffs * v_rsm_texel.flux.b;

    o_red_color = shR;
    o_green_color = shG;
    o_blue_color = shB;
}

`