import Component from "../../templates/components/Component";

export default [
    Component.terrainInstance("TERRAIN", "terrainID"),
    Component.materialInstance("MATERIAL", "materialID", true),
    Component.boolean("HAS_COLLISION", "hasCollision")
]