import Component from "../basic/Component"

export default class ScriptComponent extends Component{

    ready = false
    scripts = []

    constructor(id) {
        super(id);
    }
}
