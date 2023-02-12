import Mesh from "../instances/Mesh";
import Entity from "../instances/Entity";
import Material from "../instances/Material";

export default class ResourceMapper {
    key: string
    dataMap: { mesh?: Mesh, material?: Material, entities: Entity[], entitiesMap: Map<string, Entity> }[] = []

    constructor(key: string) {
        this.key = key
    }

    removeBlock(entities: Entity[]) {
        const mapToRemove = {}
        for (let i = 0; i < entities.length; i++) {
            const meshID = entities[i].meshRef?.id
            if (!meshID)
                continue
            if (!mapToRemove[meshID])
                mapToRemove[meshID] = {}
            mapToRemove[meshID][entities[i].id] = 1
        }
        for (let i = 0; i < this.dataMap.length; i++) {
            const current = this.dataMap[i]
            if (!mapToRemove[current[this.key].id])
                continue
            const toRemove = mapToRemove[current[this.key].id]
            const newArr = []
            for (let j = 0; j < current.entities.length; j++) {
                const entity = current.entities[j]
                if (toRemove[entity.id]) {
                    current.entitiesMap.delete(entity.id)
                    continue
                }
                newArr.push(entity)
            }
            current.entities = newArr
        }
    }

    unlink(entityID: string) {
        const found = this.dataMap.filter(m => m.entitiesMap.has(entityID))
        found.forEach(f => {
            f.entities.splice(f.entities.findIndex(entity => entity.id === entityID), 1)
            f.entitiesMap.delete(entityID)
        })
    }

    delete(resource: string) {
        const index = this.dataMap.findIndex(m => m[this.key].id === resource)
        if (index < 0)
            return;
        const oldRef = this.dataMap[index].entities
        this.dataMap.splice(index, 1)

        return oldRef
    }
}