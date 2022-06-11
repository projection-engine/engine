import Component from "../basic/Component"
import generateNextID from "../utils/generateNextID"

export default class PickComponent extends Component {
    __pickID = [0, 0, 0]

    constructor(id, quantity) {
        super(id, PickComponent.constructor.name)

        this.__pickID = generateNextID(quantity)
    }
    get pickID (){
        return this.__pickID
    }
    get pickIndex (){
        return this.__pickID.reduce((previousValue, currentValue) => {
            return previousValue + currentValue * 255
        }, 0)
    }
}