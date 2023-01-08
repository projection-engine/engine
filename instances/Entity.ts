import EntityAPI from "../lib/utils/EntityAPI";
import getComponentInstance from "../utils/get-component-instance";
import serializeStructure from "../utils/serialize-structure";
import Engine from "../Engine";
import Component from "../templates/components/Component";
import ComponentAbstract from "./entity-abstraction/ComponentAbstract";


export default class Entity extends ComponentAbstract {
    [key: string]: any;
    readonly id
    queryKey: string
    name: string
    active = true
    scripts = []
    children: Entity[] = []
    parent?: Entity
    parentCache?: string
    pickID: [number, number, number] = [-1, -1, -1]


    constructor(id = crypto.randomUUID(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this.active = active
        this.queryKey = id.slice(0, id.length / 2);
    }

    get pickIndex() {
        return this.pickID[0] * 255 + this.pickID[1] * 255 + this.pickID[2] * 255
    }

    addComponent<T>(KEY): T {
        const instance = getComponentInstance(KEY)
        if (instance != null) {
            instance.entity = this
            this.components.set(KEY, instance)
            this.updateInternalComponentRef(KEY, instance)
            EntityAPI.registerEntityComponents(this)

            return <T>instance
        }
    }

    removeComponent(KEY) {
        const hasComponent = this.components.get(KEY) != null
        this.components.delete(KEY)

        if (hasComponent) {
            EntityAPI.registerEntityComponents(this, KEY)
            this.updateInternalComponentRef(KEY, undefined)
        }
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



}