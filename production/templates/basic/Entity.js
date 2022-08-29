import {v4} from "uuid"
import cloneClass from "../../utils/clone-class"
import Movable from "./Movable";


export default class Entity extends Movable {
    id
    queryKey
    name
    active
    components = {}
    scripts = []
    children = []
    parent
    pickID = [-1, -1, -1]

    constructor(id = v4(), name = "Empty entity", active = true) {
        super()
        this.id = id
        this.name = name
        this.active = active
        this.queryKey = id.slice(0, id.length / 2);
    }

    get pickIndex() {
        return this.pickID[0] * 255 + this.pickID[1] * 255 + this.pickID[2] * 255
    }

    serializable() {
        const temp = {...this}
        delete temp.parent
        temp.parent = this.parent?.id
        delete temp.children
        return temp
    }

    clone() {
        let clone = new Entity()
        clone.name = this.name
        let newComponents = {}

        Object.keys(this.components).forEach(c => {
            const cClone = cloneClass(this.components[c])
            cClone.id = v4()
            newComponents[c] = cClone
        })

        delete clone.components
        clone.components = newComponents
        clone.active = this.active

        clone.rotation = [...this.rotation]
        clone.rotationQuaternion = [...this.rotationQuaternion]
        clone.translation = [...this.translation]
        clone.scaling = [...this.scaling]
        clone.matrix = [...this.matrix]
        clone.baseTransformationMatrix = [...this.baseTransformationMatrix]
        clone.lockedRotation = this.lockedRotation
        clone.lockedScaling = this.lockedScaling

        return clone
    }
}