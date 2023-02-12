import MeshResourceMapper from "../lib/MeshResourceMapper";

export default function loopMeshes(callback:Function){

    const toRender = MeshResourceMapper.meshesArray
    const size = toRender.length
    if (size === 0)
        return
    for (let meshIndex = 0; meshIndex < size; meshIndex++) {
        const meshGroup = toRender[meshIndex]
        const entities = meshGroup.entities
        const entitiesSize = entities.length
        for (let entityIndex = 0; entityIndex < entitiesSize; entityIndex++) {
            const entity = entities[entityIndex]
            if (!entity.active || entity.isCulled)
                continue
            callback(entity, meshGroup.mesh)
        }
    }
}