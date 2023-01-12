import Component from "../../instances/components/Component";

export default [
    Component.group("SPECULAR_LIGHT", [
        Component.number("LOD", "mipmaps", 10, 1, 1, false, true, "isDiffuse"),

    ]),
    Component.group("RESOLUTION", [
        Component.options("resolution", [
            {
                label: "128p",
                value: 128,
            },
            {
                label: "512p",
                value: 512,
            },
            {
                label: "1024p",
                value: 1024,
            },
            {
                label: "2048p",
                value: 2048,
            }
        ])
    ])
]