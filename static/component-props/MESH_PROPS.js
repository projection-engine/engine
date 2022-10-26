import Component from "../../templates/components/Component";

export default [
    Component.group("RENDERING", [
        Component.meshInstance("MESH", "meshID"),
        Component.materialInstance("MATERIAL", "materialID"),
    ]),
    Component.group("CONTRIBUTION", [
        Component.boolean("CASTS_SHADOWS", "castsShadows"),
        Component.boolean("CONTRIBUTE_TO_PROBES", "contributeToProbes"),
    ]),
    Component.group("INDIRECT_LIGHTS", [
        Component.boolean("DIFFUSE_PROBE_INFLUENCE", "diffuseProbeInfluence"),
        Component.boolean("SPECULAR_PROBE_INFLUENCE", "specularProbeInfluence"),
    ])
]