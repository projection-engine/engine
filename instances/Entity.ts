import EntityAPI from "../lib/utils/EntityAPI";
import getComponentInstance from "../utils/get-component-instance";
import serializeStructure from "../utils/serialize-structure";
import Component from "./components/Component";
import ComponentResources from "./components/ComponentResources";
import EntityWorkerAPI from "../lib/utils/EntityWorkerAPI";
import VisibilityRenderer from "../runtime/VisibilityRenderer";
import QueryAPI from "../lib/utils/QueryAPI";


export default class Entity extends ComponentResources {
    [key: string]: any;

    #id = crypto.randomUUID()
    get id() {
        return this.#id
    }

    #isCollection = false
    get isCollection() {
        return this.#isCollection
    }

    queryKey = this.#id.slice(0, this.#id.length / 2)
    name = ""
    active = true
    scripts = []
    #parent?: Entity
    parentID?: string
    #pickID = new Float32Array(3)
    #pickIndex: number = -1
    #children = []


    constructor(id?: string, isCollection?: boolean) {
        super();
        this.#id = id ?? this.#id
        this.#isCollection = isCollection ?? false
    }

    get allComponents() {
        return Array.from(this.components.entries())
    }


    setPickID(data: number[]) {
        data.forEach((v, i) => this.#pickID[i] = v)
        this.#pickIndex = (data[0] + data[1] + data[2]) * 255
    }

    get pickID(): Float32Array {
        return this.#pickID
    }

    get pickIndex() {
        return this.#pickIndex
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
        const temp: MutableObject = {...this}
        const parsedComponents: { components: Component[] } = {components: []}

        temp.id = this.#id
        temp.isCollection = this.#isCollection
        temp.parent = this.parent?.id
        temp.parentID = this.parent?.id

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


    removeParent() {
        if (!this.#parent)
            return;
        const prev = this.#parent
        this.#parent = undefined
        prev.removeChild(this)
        if (EntityAPI.isRegistered(this))
            EntityWorkerAPI.updateEntityReference(this)
    }

    addChild(entity: Entity) {
        if (entity === this || entity.parent !== this || this.#children.includes(entity)) {
            console.log("NOT ADDING CHILD")
            return
        }
        this.#children.push(entity)
    }

    removeChild(entity: Entity) {
        if (entity.parent || !this.#children.includes(entity))
            return
        this.#children.splice(this.#children.indexOf(entity), 1)
    }

    addParent(parent: Entity) {
        if (!parent || parent === this || parent === this.#parent || QueryAPI.isChildOf(this, parent.id) || QueryAPI.isChildOf(parent, this.id))
            return;
        this.removeParent()
        this.#parent = parent
        parent.addChild(this)
        if (EntityAPI.isRegistered(this)) {
            EntityWorkerAPI.updateEntityReference(this)
            this.changed = true
        }
    }

    get parent() {
        return this.#parent
    }

    get children() {
        return this.#children
    }
}