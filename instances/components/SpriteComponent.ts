import SPRITE_PROPS from "../../static/component-props/SPRITE_PROPS";
import Component from "./Component";
import COMPONENTS from "../../static/COMPONENTS";

export default class SpriteComponent extends Component {
    static get componentKey(): string {
        return COMPONENTS.SPRITE
    }
    get componentKey(): string {
        return SpriteComponent.componentKey
    }
    _props = SPRITE_PROPS
    imageID?: string
    attributes: [number, number] = [0, 0]

    get alwaysFaceCamera() {
        return this.attributes[0] === 1
    }

    get keepSameSize() {
        return this.attributes[1] === 1
    }


    set alwaysFaceCamera(d) {
        this.attributes[0] = d ? 1 : 0
    }

    set keepSameSize(d) {
        this.attributes[1] = d ? 1 : 0
    }
}