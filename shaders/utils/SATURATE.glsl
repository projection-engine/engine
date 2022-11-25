vec3 saturation(vec3 rgb, float adjustment){
    vec3 intensity = vec3(dot(rgb, vec3(0.2125, 0.7154, 0.0721)));
    return mix(intensity, rgb, adjustment);
}