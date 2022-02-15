import Component from "../basic/Component";
import generateNextID from "../../../workers/generateNextID";

export default class PickComponent extends Component {
    pickID = [0, 0, 0]

    constructor(id, quantity) {
        super(id, PickComponent.constructor.name);

        this.pickID = generateNextID(quantity+1)
    }

}