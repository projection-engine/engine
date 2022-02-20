import randomID from "../../../utils/misc/randomID";


export default class Entity {
    id
    name
    active
    components = {}
    linkedTo

    constructor(id = randomID(), name = 'Empty entity', active=true, linkedTo) {
        this.id = id
        this.name = name
        this.active = active

        this.linkedTo = linkedTo
    }

    addComponent(componentClassObject) {
        this.components[componentClassObject.constructor.name] = componentClassObject
    }

    removeComponent(componentName) {
        delete this.components[componentName]
    }


}