import Component from "../basic/Component";

export default class PickComponent extends Component {
    pickID = [0, 0, 0]

    constructor(id, pickID) {
        super(id, PickComponent.constructor.name);
        this.pickID = pickID
    }

}