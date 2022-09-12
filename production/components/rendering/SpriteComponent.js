import SPRITE_PROPS from "../../data/component-props/SPRITE_PROPS";
import Component from "../Component";

export default class SpriteComponent extends Component{
    _props = SPRITE_PROPS
    name = "SPRITE"

    imageID
    isInstanced = false

    attributes = [0, 0] // [ alwaysFaceCamera, keepSameSize, iconSize ]

    get alwaysFaceCamera(){
        return this.attributes[0] === 1
    }
    get keepSameSize(){
        return this.attributes[1] === 1
    }


    set alwaysFaceCamera(d){
        this.attributes[0] = d ? 1 : 0
    }
    set keepSameSize(d){
        this.attributes[1] = d ? 1 : 0
    }


    constructor() {
        super()
    }
}