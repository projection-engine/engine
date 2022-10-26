import cloneClass from "../../../../../../src/utils/clone-class";
import NODE_TYPES from "../templates/NODE_TYPES";
import resolveRelationship from "./resolve-relationship";
import getShaderTemplate from "./get-shader-template";

export default async function compileFragmentShader(n, links, shadingType, discardedLinks = ["worldOffset"], noAmbient) {
    const nodes = n.map(nn =>  cloneClass(nn))
    const startPoint = nodes.find(n => n.type === NODE_TYPES.OUTPUT)
    startPoint.shadingType = shadingType
    if (noAmbient)
        startPoint.ambientInfluence = false
    const codeString = getShaderTemplate(shadingType),
        uniforms = [],
        uniformData = []
    let toJoin = [], typesInstantiated = {}
    nodes.forEach(n => {
        if (n.type === NODE_TYPES.FUNCTION && !typesInstantiated[n.constructor.name]) {
            toJoin.push(n.getFunctionInstance())
            typesInstantiated[n.constructor.name] = true
        }
    })
    codeString.functions = toJoin.join("\n")
    toJoin = []
    typesInstantiated = {}
    await Promise.all(nodes.map((n, i) => new Promise(async resolve => {
        if (typeof n.getInputInstance === "function" && !typesInstantiated[n.id]) {
            const res = await n.getInputInstance(i, uniforms, uniformData)
            toJoin.push(res)
            resolve()
            typesInstantiated[n.id] = true
        } else resolve()
    })))
    codeString.inputs = toJoin.join("\n")


    let body = []
    resolveRelationship(startPoint, [], links.filter(l => l.target.id !== startPoint.id || l.target.id === startPoint.id && !discardedLinks.includes(l.target.key)), nodes, body, false)
    return {
        code: `
            ${codeString.static}
            ${codeString.inputs}
            ${codeString.functions}
            ${codeString.wrapper(body.join("\n"), startPoint.ambientInfluence)}
        `,
        uniforms,
        uniformData
    }

}