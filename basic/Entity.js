import {v4 as uuidv4} from "uuid"
import COMPONENTS from "../templates/COMPONENTS"
import FolderComponent from "../components/FolderComponent"
import MeshComponent from "../components/MeshComponent"

export default class Entity {
    id
    name
    active
    components = {}
    linkedTo
    isBlueprint = false


    constructor(id = uuidv4(), name = "Empty entity", active=true, linkedTo, isBlueprint) {
        this.id = id
        this.name = name
        this.active = active
        this.isBlueprint = isBlueprint
        this.linkedTo = linkedTo
    }
    get isFolder(){
        return this.components[COMPONENTS.FOLDER] instanceof FolderComponent
    }
    get isMesh(){
        return this.components[COMPONENTS.MESH] instanceof MeshComponent
    }
}