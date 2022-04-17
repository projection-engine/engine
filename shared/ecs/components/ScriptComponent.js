import Component from "../basic/Component";

export default class ScriptComponent extends Component{
    executionTemplate
    ready = false
    constructor(id) {
        super(id, ScriptComponent.constructor.name);
    }
}
