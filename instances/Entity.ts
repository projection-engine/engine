import EntityAPI from "../lib/utils/EntityAPI";
import getComponentInstance from "../utils/get-component-instance";
import serializeStructure from "../utils/serialize-structure";
import Component from "./components/Component";
import ComponentResources from "./components/ComponentResources";
import EntityWorkerAPI from "../lib/utils/EntityWorkerAPI";
import QueryAPI from "../lib/utils/QueryAPI";
import DynamicMap from "../resource-libs/DynamicMap";


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

    #colorIdentifier = [255, 255, 255]
    queryKey = this.#id.slice(0, this.#id.length / 2)
    name = ""
    active = true
    scripts = []
    #parent?: Entity
    parentID?: string
    #pickID = new Float32Array(3)
    #pickIndex: number = -1
    #children = new DynamicMap<Entity>()

    get colorIdentifier() {
        return this.#colorIdentifier
    }

    set colorIdentifier(data) {
        if (data && Array.isArray(data))
            this.#colorIdentifier = data
    }


    constructor(id?: string, isCollection?: boolean) {
        super();
        this.#id = id ?? this.#id
        this.#isCollection = isCollection ?? false

    }

    get allComponents() {
        return this.components.array
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
            this.components.add(KEY, instance)
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
        temp.colorIdentifier = this.#colorIdentifier

        this.components.array.forEach(component => {
            parsedComponents[component.componentKey] = component
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
    }

    addChild(entity: Entity) {
        if (!entity || entity === this || entity.parent !== this || this.#children.has(entity.id)) {
            return
        }
        this.#children.add(entity.id, entity)
    }

    removeChild(entity: Entity) {
        if (!entity || entity.parent || !this.#children.has(entity.id))
            return
        this.#children.delete(entity.id)
    }

    addParent(parent: Entity) {
        if (!parent || parent === this || parent === this.#parent || QueryAPI.isChildOf(this, parent.id) || QueryAPI.isChildOf(parent, this.id)) {
            return;
        }
        if (this.#parent)
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