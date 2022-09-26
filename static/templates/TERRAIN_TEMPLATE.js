import TERRAIN_LAYERED from "../materials/TERRAIN_LAYERED";

export default {
    image: "",
    dimensions: 5,
    scale: 5,
    material: TERRAIN_LAYERED,
    uniforms: [
        {key: "albedo1", type: "sampler2D"},
        {key: "albedo2", type: "sampler2D"},
        {key: "albedo3", type: "sampler2D"},

        {key: "normal1", type: "sampler2D"},
        {key: "normal2", type: "sampler2D"},
        {key: "normal3", type: "sampler2D"},


        {key: "roughness", type: "sampler2D"},
        {key: "layerMap", type: "sampler2D"},
    ]
}