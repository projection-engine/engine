import SPRITE_PROPS from "../data/component-props/SPRITE_PROPS";

export default class SpriteComponent {
    _props = SPRITE_PROPS
    name = "SPRITE"

    imageID
    backgroundColor = [0, 0, 0, 0]
    colorOverride = [1, 1, 1]
    useImageColors = false
    alwaysFaceCamera = false

    set alpha(data){
        this.backgroundColor[3] = data
    }
    get alpha(){
        return this.backgroundColor[3]
    }

    constructor(imageID) {
        this.imageID = imageID
    }

}