import {v4} from "uuid";

export default class UIEntity {
    parent
    children = []
    name = "New UI Entity"

    mountingPoint
    id = v4()

    constructor(id, name) {
        if (name)
            this.name = name
        if (id)
            this.id = id
    }
}