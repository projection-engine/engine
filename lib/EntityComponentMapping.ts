import DynamicMap from "./utils/DynamicMap";
import Entity from "../instances/Entity";

export default class EntityComponentMapping{
    static meshesToDraw = new DynamicMap<Entity>()
    static sprites = new DynamicMap<Entity>()
    static lights = new DynamicMap<Entity>()
    static decals = new DynamicMap<Entity>()
}