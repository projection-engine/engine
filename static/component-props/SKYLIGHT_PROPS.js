import Component from "../../templates/components/Component";

export default [
    Component.number("LOD", "mipmaps", 10, 1, 1, false, true, "isDiffuse"),

    Component.options("RESOLUTION", "resolution", [
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
]