import Mesh from "../instances/Mesh";
import Entity from "../instances/Entity";
import GPU from "../GPU";
import ResourceMapper from "./ResourceMapper";

type Resource = { mesh: Mesh, entities: Entity[], entitiesMap: Map<string, Entity> }[]
export default class MeshResourceMapper {
    static #mapper = new ResourceMapper("mesh")

    static get meshesArray(): Resource{
        return <Resource> MeshResourceMapper.#mapper.dataMap
    }

    static removeBlock(entities:Entity[]){
       MeshResourceMapper.#mapper.removeBlock(entities)
    }
    static unlinkEntityMesh(entityID:string){
        MeshResourceMapper.#mapper.unlink(entityID)
    }

    static linkEntityMesh(entity:Entity, meshID:string){
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
    }

    static deleteMesh(meshID:string){
        const oldRef = this.#mapper.delete(meshID)
        oldRef.forEach(e => {
            e.meshComponent.meshID = undefined
        })
    }
}