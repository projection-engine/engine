import ComponentProps from "../data/ComponentProps";

export default [

    ComponentProps.boolean("SPECULAR_PROBE", "specularProbe"),
    ComponentProps.number("LOD", "mipmaps", 10, 1, 1, false, true, "isDiffuse"),

    ComponentProps.options("RESOLUTION", "resolution", [
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
    ]),

    ComponentProps.group("MULTIPLIER", [
        ComponentProps.array(["R", "G", "B"], "multiplier")
    ]),
]