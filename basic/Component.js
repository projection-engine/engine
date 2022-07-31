import {v4 as uuidv4} from "uuid"

export default class Component {
    id = uuidv4()
    active = true

    _props = []
    get props(){
        return this._props
    }
    constructor(id) {
        if(id)
            this.id = id
    }
}