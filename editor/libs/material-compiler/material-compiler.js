import NODE_TYPES from "./templates/NODE_TYPES"
import MATERIAL_RENDERING_TYPES from "../../../static/MATERIAL_RENDERING_TYPES";
import cloneClass from "../../../../../src/utils/clone-class";
import compileFragmentShader from "./utils/compile-fragment-shader";
import getVertexShader from "./utils/get-vertex-shader";


export default async function materialCompiler(n, links) {
    const nodes = n.map(nn => cloneClass(nn))
    const startPoint = nodes.find(n => n.type === NODE_TYPES.OUTPUT)

    if (startPoint) {
        const samplers = n.filter(e => typeof e.format === "object"), uniformNodes = n.filter(e => e.uniform)
        const {
            code,
            uniforms,
            uniformData
        } = await compileFragmentShader(
            n,
            links,
            startPoint.shadingType,
            startPoint.inputs.map(i => {
                if (i.disabled)
                    return i.key
                return undefined
            }).filter(i => i)
        )

        const cubeMapShader = await compileFragmentShader(
            n,
            links,
            MATERIAL_RENDERING_TYPES.FORWARD,
            [
                "al",
                "normal",
                "ao",
                "roughness",
                "metallic",
                "opacity",
                "emission",
                "worldOffset"
            ], false)
        return {
            info: [
                {key: "samplers", label: "Texture samplers", data: samplers.length},
                {key: "uniforms", label: "Uniform quantity", data: uniformNodes.length}
            ],
            cubeMapShader,
            shader: code,
            vertexShader: getVertexShader(startPoint.shadingType),
            uniforms,
            uniformData,
            settings: {
                shadingType: startPoint.shadingType,
                faceCulling: startPoint.faceCulling,
                depthTest: startPoint.depthTest,
                blend: startPoint.blend
            }
        }
    } else return {}
}