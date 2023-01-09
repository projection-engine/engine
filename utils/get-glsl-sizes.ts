export default function getGlslSizes(type) {
    switch (type) {
        case "float": case "int": case "bool": return [4,4];
        case "mat4": return [64,64];
        case "mat3": return [48,48];
        case "vec2": return [8,8];
        case "vec3": return [16,12];
        case "vec4": return [16,16];
        default: return [0,0];
    }
}