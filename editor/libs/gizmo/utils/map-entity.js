import Entity from "../../../../production/templates/basic/Entity"
import COMPONENTS from "../../../../production/data/COMPONENTS"
import TransformComponent from "../../../../production/templates/components/TransformComponent"
import Transformation from "../../../../production/services/Transformation"
import getPickerId from "../../../../production/utils/get-picker-id";

export default function mapEntity(axis, type) {
    const e = new Entity(undefined)
    e.components[COMPONENTS.TRANSFORM] = new TransformComponent()
    let s, t = [0, 0, 0], r, index
    switch (axis) {
    case "x":
        index = 2
        break
    case "y":
        index = 3
        break
    case "z":
        index = 4
        break
    }
    switch (type) {
    case  "TRANSLATION":
        switch (axis) {
        case "x":
            s = [.75, 0.05, 0.05]
            r = [0, 0, 0]
            break
        case "y":
            s = [.75, 0.05, 0.05]
            r = [0, 0, 1.57]
            break
        case "z":
            s = [.75, 0.05, 0.05]
            r = [3.141592653589793, -1.57, 3.141592653589793]
            break
        }
        break
    case "ROTATION":
        switch (axis) {
        case "x":
            s = [1, .1, 1]
            r = [0, 0, 1.57]
            break
        case "y":
            s = [1, .1, 1]
            r = [0, 0, 0]
            break
        case "z":
            s = [1, .1, 1]
            r = [1.57, 0, 0]
            break
        }
        break
    case "SCALE":
        switch (axis) {
        case "x":
            t = [0, 0, 0]
            s = [.2, 0.2, 0.2]
            r = [0, 1.57, 0]
            break
        case "y":
            t = [0, 0, 0]
            s = [.2, 0.2, 0.2]
            r = [-1.57, 1.57, 0]
            break
        case "z":
            t = [0, 0, 0]
            s = [.2, 0.2, 0.2]
            r = [3.1415, -3.1415, 3.1415]
            break
        }
        break
    }

    e.pickID = getPickerId(index)
    e.components[COMPONENTS.TRANSFORM].translation = t
    e.components[COMPONENTS.TRANSFORM].rotation = r
    e.components[COMPONENTS.TRANSFORM].scaling = s
    e.components[COMPONENTS.TRANSFORM].transformationMatrix = Transformation.transform(t, e.components[COMPONENTS.TRANSFORM].rotationQuat, s)

    return e
}