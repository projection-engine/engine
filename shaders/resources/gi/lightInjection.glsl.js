export const vertex = `#version 300 es

    precision highp float;
 
    uniform lowp int u_grid_size;
    uniform lowp int u_rsm_size;
    
    uniform sampler2D u_rsm_flux;
    uniform sampler2D u_rsm_world_positions;
    uniform sampler2D u_rsm_world_normals;
        
        
    @import(lvpCommon)
        
    
    struct RSMTexel 
    {
        vec3 world_position;
        vec3 world_normal;
        vec4 flux;
    };
    
    out RSMTexel v_rsm_texel;
    
    RSMTexel get_rsm_texel(ivec2 texCoord) 
    {
        RSMTexel texel;
        texel.world_normal = texelFetch(u_rsm_world_normals, texCoord, 0).xyz;
    
        // Displace the position by half a normal
        texel.world_position = texelFetch(u_rsm_world_positions, texCoord, 0).xyz + 0.5 * CELLSIZE * texel.world_normal;
        texel.flux = texelFetch(u_rsm_flux, texCoord, 0);
        return texel;
    }
    
    // Get ndc texture coordinates from gridcell
    vec2 get_grid_output_position(ivec3 gridCell)
    {
        float f_texture_size = float(u_grid_size);
        // Displace int coordinates with 0.5
        vec2 tex_coords = vec2((gridCell.x % u_grid_size) + u_grid_size * gridCell.z, gridCell.y) + vec2(0.5);
        // Get ndc coordinates
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
            
            
    @import(lvpCommon)
            
    layout(location = 0) out vec4 o_red_color;
    layout(location = 1) out vec4 o_green_color;
    layout(location = 2) out vec4 o_blue_color;
    
    struct RSMTexel {
        vec3 world_position;
        vec3 world_normal;
        vec4 flux;
    };
    
    uniform lowp int u_grid_size;
    uniform lowp int u_rsm_size;
    
    in RSMTexel v_rsm_texel;
    
    void main()
    {
        float surfelWeight = float(u_grid_size) / float(u_rsm_size);
        vec4 SH_coeffs = (evalCosineLobeToDir(v_rsm_texel.world_normal) / PI) * surfelWeight;
        vec4 shR = SH_coeffs * v_rsm_texel.flux.r;
        vec4 shG = SH_coeffs * v_rsm_texel.flux.g;
        vec4 shB = SH_coeffs * v_rsm_texel.flux.b;
    
        o_red_color = vec4(1.);
        o_green_color = shG;
        o_blue_color = shB;
    }
`