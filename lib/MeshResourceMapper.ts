import DynamicMap from "../resource-libs/DynamicMap";
import Mesh from "../instances/Mesh";
import Entity from "../instances/Entity";
import GPU from "../GPU";

export default class MeshResourceMapper {
    static meshesArray: {mesh: Mesh, entities: Entity[], entitiesMap: Map<string, Entity>}[] = []

    static unlinkEntityMesh(entityID:string){
        const found = MeshResourceMapper.meshesArray.filter(m => m.entitiesMap.has(entityID))
        found.forEach(f => {
            f.entities.splice(f.entities.findIndex(entity => entity.id === entityID), 1)
            f.entitiesMap.delete(entityID)
        })
    }

    static linkEntityMesh(entity:Entity, meshID:string){
        // console.log(meshID)

        let index = MeshResourceMapper.meshesArray.findIndex(m => m.mesh.id === meshID)
        if(index < 0 && !GPU.meshes.has(meshID))
            return;
        if(index < 0) {
            MeshResourceMapper.meshesArray.push({mesh: GPU.meshes.get(meshID), entitiesMap: new Map(), entities: []})
            index = MeshResourceMapper.meshesArray.length - 1
        }
        const instance = MeshResourceMapper.meshesArray[index]
        if(instance.entitiesMap.has(entity.id))
            return;
        instance.entities.push(entity)
        instance.entitiesMap.set(entity.id, entity)
        console.trace(MeshResourceMapper.meshesArray)
    }

    static deleteMesh(meshID:string){
        const index = MeshResourceMapper.meshesArray.findIndex(m => m.mesh.id === meshID)
        if(index < 0)
            return;
        const oldRef = MeshResourceMapper.meshesArray[index].entities
        MeshResourceMapper.meshesArray.splice(index, 1)
        oldRef.forEach(e => {
            e.meshComponent.meshID = undefined
        })
    }
}