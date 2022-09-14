import UIElement from "../../production/instances/UIElement";

export default function parseUiElement(obj) {
    const newElement = new UIElement()
    Object.entries(obj)
        .forEach(([key, value]) => {
            if(key !== "_element")
            newElement[key] = value
        })
    return newElement
}