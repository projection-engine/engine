import DynamicMap from "./DynamicMap";
import type Entity from "../instances/Entity";
import Engine from "../Engine";
import ENVIRONMENT from "../static/ENVIRONMENT";
import PhysicsAPI from "../lib/rendering/PhysicsAPI";
import UIAPI from "../lib/rendering/UIAPI";

export default class ResourceEntityMapper {
    static queryMap = new Map<string, Entity>()
    static entities = new DynamicMap<Entity>()

    static meshes = new DynamicMap<Entity>()
    static sprites = new DynamicMap<Entity>()
    static lights = new DynamicMap<Entity>()
    static decals = new DynamicMap<Entity>()
    static ui = new DynamicMap<Entity>()
    static lightProbe = new DynamicMap<Entity>()
    static atmosphere = new DynamicMap<Entity>()
    static cameras = new DynamicMap<Entity>()

    static clear() {
        ResourceEntityMapper.meshes.clear()
        ResourceEntityMapper.decals.clear()
        ResourceEntityMapper.cameras.clear()
        ResourceEntityMapper.ui.clear()
        ResourceEntityMapper.atmosphere.clear()
        ResourceEntityMapper.lightProbe.clear()
        ResourceEntityMapper.sprites.clear()
        ResourceEntityMapper.lights.clear()

    }

    static addBlock(entities: Entity[]) {
        const data = {
            meshes: [],
            decals: [],
            cameras: [],
            ui: [],
            atmosphere: [],
            lightProbe: [],
            sprites: [],
            lights: [],
        }
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            if (entity.lightComponent !== undefined)
                data.lights.push(entity.id, entity)
            if (entity.spriteComponent !== undefined)
                data.sprites.push(entity.id, entity)
            if (entity.decalComponent !== undefined)
                data.decals.push(entity.id, entity)
            if (entity.uiComponent !== undefined)
                data.ui.push(entity.id, entity)
            if (entity.atmosphereComponent !== undefined)
                data.atmosphere.push(entity.id, entity)
            if (entity.lightProbeComponent !== undefined)
                data.lightProbe.push(entity.id, entity)
            if (entity.cameraComponent !== undefined)
                data.cameras.push(entity.id, entity)
            if (entity.uiComponent !== undefined) {
                data.ui.push(entity.id, entity)
                UIAPI.createUIEntity(entity)
            }
            if (entity.meshComponent !== undefined) {
                data.meshes.push(entity.id, entity)
                entity.meshComponent.updateComponentReferences()
            }
        }

        ResourceEntityMapper.meshes.addBlock(data.meshes, e => e.id)
        ResourceEntityMapper.decals.addBlock(data.decals, e => e.id)
        ResourceEntityMapper.cameras.addBlock(data.cameras, e => e.id)
        ResourceEntityMapper.ui.addBlock(data.ui, e => e.id)
        ResourceEntityMapper.atmosphere.addBlock(data.atmosphere, e => e.id)
        ResourceEntityMapper.lightProbe.addBlock(data.lightProbe, e => e.id)
        ResourceEntityMapper.sprites.addBlock(data.sprites, e => e.id)
        ResourceEntityMapper.lights.addBlock(data.lights, e => e.id)
    }

    static addEntity(entity: Entity) {
        if (Engine.environment !== ENVIRONMENT.DEV && entity.rigidBodyComponent) {
            PhysicsAPI.registerRigidBody(entity)
        }
        if (entity.lightComponent !== undefined)
            ResourceEntityMapper.lights.add(entity.id, entity)
        if (entity.spriteComponent !== undefined)
            ResourceEntityMapper.sprites.add(entity.id, entity)
        if (entity.decalComponent !== undefined)
            ResourceEntityMapper.decals.add(entity.id, entity)
        if (entity.uiComponent !== undefined)
            ResourceEntityMapper.ui.add(entity.id, entity)
        if (entity.atmosphereComponent !== undefined)
            ResourceEntityMapper.atmosphere.add(entity.id, entity)
        if (entity.lightProbeComponent !== undefined)
            ResourceEntityMapper.lightProbe.add(entity.id, entity)
        if (entity.cameraComponent !== undefined)
            ResourceEntityMapper.cameras.add(entity.id, entity)
        if (entity.uiComponent !== undefined) {
            ResourceEntityMapper.ui.add(entity.id, entity)
            UIAPI.createUIEntity(entity)
        }
        if (entity.meshComponent !== undefined) {
            ResourceEntityMapper.meshes.add(entity.id, entity)
            entity.meshComponent.updateComponentReferences()
        }
    }

    static removeBlock(entities: Entity[]) {
        ResourceEntityMapper.meshes.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.decals.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.cameras.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.ui.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.atmosphere.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.lightProbe.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.sprites.removeBlock(entities, entity => entity.id)
        ResourceEntityMapper.lights.removeBlock(entities, entity => entity.id)
    }
}