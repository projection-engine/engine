import SPRITE_PROPS from "../../static/component-props/SPRITE_PROPS";
import Component from "./Component";

export default class SpriteComponent extends Component {
    _props = SPRITE_PROPS
    imageID?: string
    attributes: [number, number, number] = [0, 0, 1]

    get alwaysFaceCamera() {
        return this.attributes[0] === 1
    }

    get keepSameSize() {
        return this.attributes[1] === 1
    }

    get flatShaded() {
        return this.attributes[2] === 1
    }
    set flatShaded(d) {
        this.attributes[2] = d ? 1 : 0
    }

    set alwaysFaceCamera(d) {
        this.attributes[0] = d ? 1 : 0
    }

    set keepSameSize(d) {
        this.attributes[1] = d ? 1 : 0
    }
}