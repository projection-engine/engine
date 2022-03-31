import randomID from "../../../utils/misc/randomID";


export default class Entity {
    id
    name
    active
    components = {}
    linkedTo
    isBlueprint = false
    constructor(id = randomID(), name = 'Empty entity', active=true, linkedTo, isBlueprint) {
        this.id = id
        this.name = name
        this.active = active
        this.isBlueprint = isBlueprint
        this.linkedTo = linkedTo
    }

    addComponent(componentClassObject) {
        this.components[componentClassObject.constructor.name] = componentClassObject
    }

    removeComponent(componentName) {
        delete this.components[componentName]
    }
}