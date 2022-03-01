export const LVP = {
    lvpCommon: `
    #define SH_C0 0.282094791 // 1 / 2sqrt(pi)
    #define SH_C1 0.488602512 // sqrt(3/pi) / 2
    
    #define SH_cosLobe_C0 0.886226925 // sqrt(pi)/2
    #define SH_cosLobe_C1 1.02332671 // sqrt(pi/3)
    #define CELLSIZE 2.25

    vec4 evalCosineLobeToDir(vec3 dir)
    {
        return vec4( SH_cosLobe_C0, -SH_cosLobe_C1 * dir.y, SH_cosLobe_C1 * dir.z, -SH_cosLobe_C1 * dir.x );
    }
    
    vec4 dirToSH(vec3 dir)
    {
        return vec4(SH_C0, -SH_C1 * dir.y, SH_C1 * dir.z, -SH_C1 * dir.x);
    }

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

    `
}