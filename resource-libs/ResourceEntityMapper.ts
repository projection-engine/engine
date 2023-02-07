import DynamicMap from "./DynamicMap";
import type Entity from "../instances/Entity";

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
    static clear(){
        ResourceEntityMapper.meshes.clear()
        ResourceEntityMapper.decals.clear()
        ResourceEntityMapper.cameras.clear()
        ResourceEntityMapper.ui.clear()
        ResourceEntityMapper.atmosphere.clear()
        ResourceEntityMapper.lightProbe.clear()
        ResourceEntityMapper.sprites.clear()
        ResourceEntityMapper.lights.clear()

    }
}