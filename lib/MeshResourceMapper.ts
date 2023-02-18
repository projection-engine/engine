import Mesh from "../instances/Mesh";
import Entity from "../instances/Entity";
import GPU from "../GPU";
import ResourceMapper from "./ResourceMapper";

type Resource = { mesh: Mesh, entities: Entity[], entitiesMap: Map<string, Entity> }[]
export default class MeshResourceMapper {
    static #mapper = new ResourceMapper("mesh")

    static inUse = new Map<string, number>()

    static get meshesArray(): Resource {
        return <Resource>MeshResourceMapper.#mapper.dataMap
    }

    static removeBlock(entities: Entity[]) {
        const found = MeshResourceMapper.#mapper.removeBlock(entities)
        for (let i = 0; i < found.length; i++) {
            const f = found[i];
            MeshResourceMapper.inUse.set(f.mesh.id, f.entities.length);
        }
    }

    static unlinkEntityMesh(entityID: string) {
        const found = MeshResourceMapper.#mapper.unlink(entityID)
        for (let i = 0; i < found.length; i++) {
            const f = found[i];
            MeshResourceMapper.inUse.set(f.mesh.id, f.entities.length);
        }
    }

    static linkEntityMesh(entity: Entity, meshID: string) {
        let index = MeshResourceMapper.meshesArray.findIndex(m => m.mesh.id === meshID)
        if (index < 0 && !GPU.meshes.has(meshID))
            return;

        if (index < 0) {
            MeshResourceMapper.meshesArray.push({mesh: GPU.meshes.get(meshID), entitiesMap: new Map(), entities: []})
            index = MeshResourceMapper.meshesArray.length - 1
        }
        MeshResourceMapper.inUse.set(meshID, (MeshResourceMapper.inUse.get(meshID) ?? 0) + 1)
        const instance = MeshResourceMapper.meshesArray[index]
        if (instance.entitiesMap.has(entity.id))
            return;
        instance.entities.push(entity)
        instance.entitiesMap.set(entity.id, entity)
    }

    static deleteMesh(meshID: string) {
        const oldRef = this.#mapper.delete(meshID)
        MeshResourceMapper.inUse.delete(meshID)
        oldRef.forEach(e => {
            e.meshComponent.meshID = undefined
        })
    }
}