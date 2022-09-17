import Component from "../../production/components/Component";
import COLLISION_TYPES from "../COLLISION_TYPES";

export default [
    Component.options(
        "COLLISION_TYPE",
        "collisionType",
        [
            {
                label: COLLISION_TYPES.BOX,
                value: COLLISION_TYPES.BOX
            },
            {
                label: COLLISION_TYPES.SPHERE,
                value: COLLISION_TYPES.SPHERE,
            },
            {
                label: COLLISION_TYPES.CAPSULE,
                value: COLLISION_TYPES.CAPSULE,
            }
        ]
    ),

    Component.group("CENTER", [
        Component.array(["X", "Y", "Z"], "center", 3, .001, undefined, undefined)
    ]),
    Component.group("SIZE", [
        Component.array(["X", "Y", "Z"], "size", 3, .001, undefined, 0, false, (comp) => comp.collisionType !== COLLISION_TYPES.BOX)
    ]),


    Component.number("RADIUS", "radius", undefined, .0001, .001, undefined, true, (comp) => comp.collisionType === COLLISION_TYPES.BOX),
    Component.number("HEIGHT", "height", undefined, .0001, .001, undefined, true, (comp) => comp.collisionType !== COLLISION_TYPES.CAPSULE),
    Component.options(
        "DIRECTION",
        "direction",
        [
            {
                label: "X",
                value: "X"
            },
            {
                label: "Y",
                value: "Y"
            },
            {
                label: "Z",
                value: "Z"
            }
        ],
        (comp) => comp.collisionType !== COLLISION_TYPES.CAPSULE
    )
]