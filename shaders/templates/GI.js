export default `
vec4 dirToSH(vec3 dir){
    return vec4(SH_C0, -SH_C1 * dir.y, SH_C1 * dir.z, -SH_C1 * dir.x);
}
vec3 getGridCellf(vec3 world_space_position, int _max_grid_size) 
{
    const vec3 center = vec3(0.);
    vec3 max_grid_size = vec3(_max_grid_size);
    vec3 min = center - vec3(max_grid_size * 0.5 * CELLSIZE);
    return vec3((world_space_position - min) / CELLSIZE);
}

vec4 sampleGI(in sampler2D t, vec3 gridCell, int gridSize) {
    float f_grid_size = float(gridSize);
    float zFloor = floor(gridCell.z);

    vec2 tex_coord = vec2(gridCell.x / (f_grid_size * f_grid_size) + zFloor / f_grid_size , gridCell.y / f_grid_size);

    vec4 t1 = texture(t, tex_coord);
    vec4 t2 = texture(t, vec2(tex_coord.x + (1.0 / f_grid_size), tex_coord.y));

    return mix(t1,t2, gridCell.z - zFloor);
}

vec3 computeGIIntensity(vec3 fragPosition, vec3 normal, int gridSize)
{
    vec4 sh_intensity = dirToSH(-normalize(normal));
    vec3 gridCell = getGridCellf(fragPosition, gridSize);

    vec4 red = sampleGI(redIndirectSampler, gridCell, gridSize);
    vec4 green = sampleGI(greenIndirectSampler, gridCell, gridSize);
    vec4 blue = sampleGI(blueIndirectSampler, gridCell, gridSize);

    return vec3(dot(sh_intensity, red), dot(sh_intensity, green), dot(sh_intensity, blue));
}
`
