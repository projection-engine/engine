export default function materialEntityMapper(entities, materials) {
    const result = []
    for (let i in materials) {
        const current = []
        for (let j in entities) {
            if (entities[j].materialUsed === materials[i].id)
                current.push(entities[j])
        }
        result.push(current)
    }
    return result
}