import DynamicMap from "./utils/DynamicMap";
import Entity from "../instances/Entity";

export default class ResourceEntityMapper {
    static meshesToDraw = new DynamicMap<Entity>()
    static sprites = new DynamicMap<Entity>()
    static lights = new DynamicMap<Entity>()
    static decals = new DynamicMap<Entity>()

    static entityMaterial = new Map<string, { [key: string]: Entity }>()
}