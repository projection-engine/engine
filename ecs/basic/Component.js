import randomID from "../../../../pages/project/utils/misc/randomID";


export default class Component {
    name
    id
    active

    constructor(id = randomID(), name, active = true) {
        this.name = name
        this.id = id
        this.active = active
    }
}