import Component from "../basic/Component"

export default class FolderComponent extends Component{
    get isNative(){
        return true
    }
    constructor(id , name, active) {
        super(id, name, active)
    }
}