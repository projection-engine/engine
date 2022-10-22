import COMPONENTS from "../static/COMPONENTS.js";

export default function materialEntityMapper(entities, materials) {
    const result = []
    for (let i = 0; i < materials.length; i++) {
        const current = []
        for (let j = 0; j < entities.length; j++) {
            const entity = entities[j]
            if (entity.components.get(COMPONENTS.MESH)?.materialID === materials[i].id)
                current.push(entity)
        }
        result.push(current)
    }
    return result
}