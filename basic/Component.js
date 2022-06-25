import {v4 as uuidv4} from "uuid"

export default class Component {
    id = uuidv4()
    active

    constructor(id) {
        if(id)
            this.id = id
    }
}