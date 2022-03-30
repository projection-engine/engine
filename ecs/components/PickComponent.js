import Component from "../basic/Component";
import generateNextID from "../../../utils/generateNextID";

export default class PickComponent extends Component {
    __pickID = [0, 0, 0]

    constructor(id, quantity) {
        super(id, PickComponent.constructor.name);

        this.__pickID = generateNextID(quantity+4)
    }
    get pickID (){
        return this.__pickID
    }
    set pickID (_){}
}