import COMPONENTS from "../../../../production/data/COMPONENTS"

export default function getEntityTranslation(entity) {
    const parent = entity.parent
    const parentMatrix = parent?.transformationMatrix
    const matrix = entity.transformationMatrix
    return parentMatrix ? [matrix[12] + parentMatrix[12], matrix[13] + parentMatrix[13], matrix[14] + parentMatrix[14]] : [matrix[12], matrix[13], matrix[14]]

}