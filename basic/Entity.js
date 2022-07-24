import {v4 as uuidv4} from "uuid"
import COMPONENTS from "../data/COMPONENTS"
import FolderComponent from "../components/FolderComponent"
import cloneClass from "../utils/clone-class"
import MeshComponent from "../components/MeshComponent"

export default class Entity {
    id
    name
    active
    components = {}
    scriptsMap = []
    scripts = []
    children = []
    parent

    constructor(id = uuidv4(), name = "Empty entity", active=true, children, parent) {
        this.id = id
        this.name = name
        this.active = active

        if(children)
            this.children = children
        if(parent)
            this.parent = parent
    }
    get isFolder(){
        return this.components[COMPONENTS.FOLDER] instanceof FolderComponent
    }
    get isMesh(){
        return this.components[COMPONENTS.MESH] instanceof MeshComponent
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
    materialUsed(){
        return this.components[COMPONENTS.MESH]?.materialID
    }
    serializable(){
        const temp = {...this}
        delete temp.parent
        temp.parent = this.parent?.id
        delete temp.children

        return temp
    }
}