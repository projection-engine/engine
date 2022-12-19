import {v4} from "uuid"
import Movable from "./Movable";
import COMPONENTS from "../static/COMPONENTS.js";
import EntityAPI from "../lib/utils/EntityAPI";
import getComponentInstance from "../utils/get-component-instance";
import serializeStructure from "../utils/serialize-structure";
import Engine from "../Engine";
import Component from "../templates/components/Component";
import LightComponent from "../templates/components/LightComponent";
import CullingComponent from "../templates/components/CullingComponent";
import Material from "./Material";
import Mesh from "./Mesh";
import MeshComponent from "../templates/components/MeshComponent";
import SkyLightComponent from "../templates/components/SkyLightComponent";
import CameraComponent from "../templates/components/CameraComponent";
import SpriteComponent from "../templates/components/SpriteComponent";
import PhysicsColliderComponent from "../templates/components/PhysicsColliderComponent";
import RigidBodyComponent from "../templates/components/RigidBodyComponent";
import UIComponent from "../templates/components/UIComponent";
import TerrainComponent from "../templates/components/TerrainComponent";

type AllComponents =
    LightComponent
    | MeshComponent
    | SkyLightComponent
    | CameraComponent
    | SpriteComponent
    | PhysicsColliderComponent
    | RigidBodyComponent
    | CullingComponent
    | UIComponent
    | TerrainComponent
    | undefined


export default class Entity extends Movable {
    [key: string]: any;

    readonly id
    readonly components = new Map<string, AllComponents>()

    queryKey: string
    name: string
    active = true
    scripts = []
    children: Entity[] = []
    parent?: Entity
    pickID: [number, number, number] = [-1, -1, -1]
    __lightComp?: LightComponent
    __cullingComponent?: CullingComponent
    __rigidBodyComponent?: RigidBodyComponent
    __hasLight: boolean = false
    __hasMesh: boolean = false
    __hasCamera: boolean = false
    __hasSkylight: boolean = false
    __hasSprite: boolean = false
    __hasCollider: boolean = false
    __hasRigidBody: boolean = false
    __hasCulling: boolean = false
    __hasUI: boolean = false
    __hasTerrain: boolean = false
    __materialRef?: Material
    __meshRef?: Mesh
    parentCache?: string

    constructor(id = v4(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this.active = active
        this.queryKey = id.slice(0, id.length / 2);
    }

    addProperty<T>(key: string, initialValue: T): void {
        this[key] = <T>initialValue

    }

    hasProperty(key: string): boolean {
        return this[key] !== undefined
    }

    get pickIndex() {
        return this.pickID[0] * 255 + this.pickID[1] * 255 + this.pickID[2] * 255
    }

    serializable() {
        const temp: any = {...this}
        const parsedComponents: { components: Component[] } = {components: []}

        delete temp.children
        temp.parent = this.parent?.id

        Array.from(this.components.entries())
            .forEach(([k, v]) => {
                parsedComponents[k] = v
            })
        temp.components = parsedComponents
        return temp
    }

    clone() {
        const str = serializeStructure(this.serializable())
        return EntityAPI.parseEntityObject(JSON.parse(str), true)
    }

    static isRegistered(entity) {
        return !!Engine.entitiesMap.get(entity.id)
    }


    addComponent<T>(KEY):T {
        const instance: AllComponents = getComponentInstance(KEY)
        if (instance != null) {
            instance.__entity = this
            this.components.set(KEY, instance)
            switch (KEY) {
                case COMPONENTS.LIGHT:
                    this.__hasLight = true
                    this.__lightComp = <LightComponent>instance
                    break
                case COMPONENTS.MESH:
                    this.__hasMesh = true
                    break
                case COMPONENTS.CAMERA:
                    this.__hasCamera = true
                    break
                case COMPONENTS.SKYLIGHT:
                    this.__hasSkylight = true
                    break
                case COMPONENTS.SPRITE:
                    this.__hasSprite = true
                    break
                case COMPONENTS.PHYSICS_COLLIDER:
                    this.__hasCollider = true
                    break
                case COMPONENTS.RIGID_BODY:
                    this.__hasRigidBody = true
                    this.__rigidBodyComponent = <RigidBodyComponent>instance
                    break
                case COMPONENTS.CULLING:
                    this.__cullingComponent = <CullingComponent>instance
                    this.__hasCulling = true
                    break
                case COMPONENTS.UI:
                    this.__hasUI = true
                    break
                case COMPONENTS.TERRAIN:
                    this.__hasTerrain = true
                    break
            }
            EntityAPI.registerEntityComponents(this)

            return <T>instance
        }
    }

    removeComponent(KEY) {
        const hasComponent = this.components.get(KEY) != null
        this.components.delete(KEY)

        if (hasComponent) {
            EntityAPI.registerEntityComponents(this, KEY)
            switch (KEY) {
                case COMPONENTS.LIGHT:
                    this.__hasLight = false
                    this.__lightComp = undefined
                    break
                case COMPONENTS.MESH:
                    this.__hasMesh = false
                    break
                case COMPONENTS.CAMERA:
                    this.__hasCamera = false
                    break
                case COMPONENTS.SKYLIGHT:
                    this.__hasSkylight = false
                    break
                case COMPONENTS.SPRITE:
                    this.__hasSprite = false
                    break
                case COMPONENTS.PHYSICS_COLLIDER:
                    this.__hasCollider = false
                    break
                case COMPONENTS.RIGID_BODY:
                    this.__hasRigidBody = false
                    this.__rigidBodyComponent = undefined
                    break
                case COMPONENTS.CULLING:
                    this.__cullingComponent = undefined
                    this.__cullingMetadata[3] = 0
                    this.__hasCulling = false
                    break
                case COMPONENTS.UI:
                    this.__hasUI = false
                    break
                case COMPONENTS.TERRAIN:
                    this.__hasTerrain = false
                    break
            }
        }
    }


}