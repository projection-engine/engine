import {v4 as uuidv4} from 'uuid';

export default class Component {
    name
    id
    active

    constructor(id = uuidv4(), name, active = true) {
        this.name = name
        this.id = id
        this.active = active
    }
}