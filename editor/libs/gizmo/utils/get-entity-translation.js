import COMPONENTS from "../../../../production/data/COMPONENTS"

export default function getEntityTranslation(el) {
    const comp = el.components[COMPONENTS.TRANSFORM]
    const parent = el.parent ? el.parent.components[COMPONENTS.TRANSFORM] : undefined
    if (comp) {
        const parentMatrix = parent?.transformationMatrix
        const matrix = comp.transformationMatrix
        return parentMatrix ? [matrix[12] + parentMatrix[12], matrix[13] + parentMatrix[13], matrix[14] + parentMatrix[14]] : [matrix[12], matrix[13], matrix[14]]
    }
}