import UIElement from "../../production/templates/UIElement";

export default function parseUiElement(obj) {
    const newElement = new UIElement()
    Object.entries(obj)
        .forEach(([key, value]) => {
            if(key !== "_element")
            newElement[key] = value
        })
    return newElement
}