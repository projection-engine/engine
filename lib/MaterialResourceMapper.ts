import Material from "../instances/Material";
import Entity from "../instances/Entity";
import GPU from "../GPU";

export default class MaterialResourceMapper {
    static materialsArray: { material: Material, entities: Entity[], entitiesMap: Map<string, Entity> }[] = []

    static unlinkEntityMaterial(entityID: string) {
        const found = MaterialResourceMapper.materialsArray.filter(m => m.entitiesMap.has(entityID))
        found.forEach(f => {
            f.entities.splice(f.entities.findIndex(entity => entity.id === entityID), 1)
            f.entitiesMap.delete(entityID)
        })
    }

    static linkEntityMaterial(entity: Entity, materialID: string) {
        let index = MaterialResourceMapper.materialsArray.findIndex(m => m.material.id === materialID)
        if (index < 0 && !GPU.materials.has(materialID))
            return;
        if (index < 0) {
            MaterialResourceMapper.materialsArray.push({
                material: GPU.materials.get(materialID),
                entitiesMap: new Map(),
                entities: []
            })
            index = MaterialResourceMapper.materialsArray.length - 1
        }
        const instance = MaterialResourceMapper.materialsArray[index]
        if (instance.entitiesMap.has(entity.id))
            return;
        instance.entities.push(entity)
        instance.entitiesMap.set(entity.id, entity)
    }

    static deleteMaterial(materialID: string) {
        const index = MaterialResourceMapper.materialsArray.findIndex(m => m.material.id === materialID)
        if (index < 0)
            return;
        const oldRef = MaterialResourceMapper.materialsArray[index].entities
        MaterialResourceMapper.materialsArray.splice(index, 1)
        oldRef.forEach(e => {
            e.meshComponent.materialID = undefined
        })
    }
}