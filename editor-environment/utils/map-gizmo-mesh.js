import Entity from "../../instances/Entity"
import TransformationAPI from "../../api/math/TransformationAPI"
import getPickerId from "../../utils/get-picker-id";

const toDeg = 57.29
export default function mapGizmoMesh(axis, type) {
    const e = new Entity(undefined)
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
                    r = [Math.PI, -1.57, Math.PI]
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
                    s = [.2, 0.2, 0.2]
                    r = [0, 1.57, 0]
                    break
                case "y":
                    s = [.2, 0.2, 0.2]
                    r = [-1.57, 1.57, 0]
                    break
                case "z":
                    s = [.2, 0.2, 0.2]
                    r = [Math.PI, -Math.PI, Math.PI]
                    break
            }
            break
        case "DUAL": {
            const SCALE = .5
            s = [SCALE, SCALE, SCALE]
            switch (axis) {
                case "XY":
                    r = [1.57, 0, 0]
                    break
                case "XZ":
                    r = [Math.PI, -1.57, Math.PI]

                    break
                case "ZY":
                    r = [0, Math.PI, -1.57]
                    break
            }
            break
        }
    }
    const q =  TransformationAPI.quat.fromEuler([], toDeg * r[0], toDeg * r[1], toDeg * r[2])
    e.pickID = getPickerId(index)
    TransformationAPI.vec3.copy(e._translation, t)
    TransformationAPI.vec3.copy(e._scaling, s)
    TransformationAPI.quat.copy(e._rotationQuat, q)

    e.matrix = TransformationAPI.transformMovable(e)

    return e
}