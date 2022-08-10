import Component from "../basic/Component"
import getPickerId from "../../utils/get-picker-id"

export default class PickComponent extends Component {
    get isNative(){
        return true
    }
    __pickID = [0, 0, 0]

    constructor(id, quantity) {
        super(id, PickComponent.constructor.name)

        this.__pickID = getPickerId(quantity)
    }
    get pickID (){
        return this.__pickID
    }
    get pickIndex (){
        return this.__pickID[0] * 255 + this.__pickID[1] * 255 + this.__pickID[2] * 255
    }
}