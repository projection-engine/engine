import {v4} from "uuid"
import COMPONENTS from "../../data/COMPONENTS"
import cloneClass from "../../utils/clone-class"
import MeshComponent from "../components/MeshComponent"


export default class Entity {
    id
    queryKey
    name
    active
    components = {}
    scripts = []
    children = []
    parent
    pickID = [-1, -1, -1]

    constructor(id = v4(), name = "Empty entity", active=true) {
        this.id = id
        this.name = name
        this.active = active
        this.queryKey = id.slice(0, id.length/2);
    }

    get isMesh(){
        return this.components[COMPONENTS.MESH] instanceof MeshComponent
    }
    get pickIndex (){
        return this.pickID[0] * 255 + this.pickID[1] * 255 + this.pickID[2] * 255
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