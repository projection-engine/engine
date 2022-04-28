export const vertex = `#version 300 es
precision highp float;

#define SH_C0 0.282094791
#define SH_C1 0.488602512
#define SH_cosLobe_C0 0.886226925
#define SH_cosLobe_C1 1.02332671
#define CELLSIZE 2.25

layout(location = 0) in vec2 a_point_position;

uniform lowp int u_grid_size;
uniform lowp int u_rsm_size;

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

vec3 getGridCellf(vec3 world_space_position, int _max_grid_size)
{
    const vec3 center = vec3(0);
    vec3 max_grid_size = vec3(_max_grid_size);
    vec3 min = center - vec3(max_grid_size * 0.5 * CELLSIZE);
    return vec3((world_space_position - min) / CELLSIZE);
}
ivec3 getGridCelli(vec3 world_space_position, int max_grid_size)
{
    return ivec3(getGridCellf(world_space_position, max_grid_size));
}
RSMTexel get_rsm_texel(ivec2 texCoord) 
{
    RSMTexel texel;
    texel.world_normal = texelFetch(u_rsm_world_normals, texCoord, 0).xyz;
    texel.world_position = texelFetch(u_rsm_world_positions, texCoord, 0).xyz + 0.5 * CELLSIZE * texel.world_normal;
    texel.flux = texelFetch(u_rsm_flux, texCoord, 0);
    return texel;
}
vec2 get_grid_output_position(ivec3 gridCell)
{
    float f_texture_size = float(u_grid_size);
    vec2 tex_coords = vec2((gridCell.x % u_grid_size) + u_grid_size * gridCell.z, gridCell.y) + vec2(0.5);
    vec2 ndc = vec2((2.0 * tex_coords.x) / (f_texture_size * f_texture_size), (2.0 * tex_coords.y) / f_texture_size) - vec2(1.0);
    return ndc;
}

void main()
{
    ivec2 rsm_tex_coords = ivec2(gl_VertexID % u_rsm_size, gl_VertexID / u_rsm_size);
    v_rsm_texel = get_rsm_texel(rsm_tex_coords);
    ivec3 grid_cell = getGridCelli(v_rsm_texel.world_position, u_grid_size);
    vec2 tex_coord = get_grid_output_position(grid_cell);
    gl_PointSize = 1.0;
    gl_Position = vec4(tex_coord, 0.0, 1.0);
}

`

export const fragment = `#version 300 es
precision highp float;

#define PI 3.1415926
#define SH_C0 0.282094791
#define SH_C1 0.488602512
#define SH_cosLobe_C0 0.886226925
#define SH_cosLobe_C1 1.02332671
#define CELLSIZE 2.25


struct RSMTexel {
    vec3 world_position;
    vec3 world_normal;
    vec4 flux;
};
in RSMTexel v_rsm_texel;

uniform lowp int u_grid_size;
uniform lowp int u_rsm_size;

layout(location = 0) out vec4 o_red_color;
layout(location = 1) out vec4 o_green_color;
layout(location = 2) out vec4 o_blue_color;

vec4 evalCosineLobeToDir(vec3 dir)
{
    return vec4( SH_cosLobe_C0, -SH_cosLobe_C1 * dir.y, SH_cosLobe_C1 * dir.z, -SH_cosLobe_C1 * dir.x );
}

void main()
{
    float surfelWeight = float(u_grid_size) / float(u_rsm_size);
    vec4 SH_coeffs = (evalCosineLobeToDir(v_rsm_texel.world_normal) / PI) * surfelWeight;
    vec4 shR = SH_coeffs * v_rsm_texel.flux.r;
    vec4 shG = SH_coeffs * v_rsm_texel.flux.g;
    vec4 shB = SH_coeffs * v_rsm_texel.flux.b;

    o_red_color = shR;
    o_green_color = shG;
    o_blue_color = shB;
}

`