import {v4 as uuidv4} from "uuid"
import COMPONENTS from "../templates/COMPONENTS"
import FolderComponent from "../components/FolderComponent"
import cloneClass from "../utils/cloneClass"

export default class Entity {
    id
    name
    active
    components = {}
    linkedTo
    transformationChanged = false

    constructor(id = uuidv4(), name = "Empty entity", active=true, linkedTo) {
        this.id = id
        this.name = name
        this.active = active
        this.linkedTo = linkedTo
    }
    get isFolder(){
        return this.components[COMPONENTS.FOLDER] instanceof FolderComponent
    }

    clone(){
        let clone = new Entity()
        clone.name = "_" + this.name
        let newComponents = {}
        Object.keys(this.components).forEach(c => {
            if (c === COMPONENTS.TRANSFORM)
                newComponents[COMPONENTS.TRANSFORM] = this.components[COMPONENTS.TRANSFORM].clone()
            else {
                const cClone = cloneClass(this.components[c])
                cClone.id = uuidv4()
                newComponents[c] = cClone
            }
        })
        delete clone.components
        clone.components = newComponents
        clone.active = this.active
        return clone
    }
    pickerInfo(){
        return {
            id: this.id,
            pickID: Math.round((this.components[COMPONENTS.PICK].pickID[0] + this.components[COMPONENTS.PICK].pickID[1] + this.components[COMPONENTS.PICK].pickID[2]) * 255)
        }
    }
}