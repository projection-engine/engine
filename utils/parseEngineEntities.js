export default function parseEngineEntities(params, entities, materials, meshes, instance) {
    let r = {
        pointLights: {},
        spotLights: {},
        meshes: {},
        skyboxes: {},
        grid: {},
        directionalLights: {},
        materials: {},
        meshSources: {},
        cubeMaps: {},

        staticPhysicsMeshes: {},
        dynamicPhysicsMeshes: {}
    }

    for (let i = 0; i < entities.length; i++) {
        const current = entities[i]
        if (current.components.PointLightComponent)
            r.pointLights[current.id] = i
        if (current.components.SpotLightComponent)
            r.spotLights[current.id] = i
        if (current.components.DirectionalLightComponent)
            r.directionalLights[current.id] = i

        if (current.components.SkyboxComponent)
            r.skyboxes[current.id] = i
        if (current.components.GridComponent)
            r.grid[current.id] = i
        if (current.components.MeshComponent) {
            r.meshes[current.id] = i
            if (!current.components.PhysicsComponent && current.components.SphereCollider)
                r.staticPhysicsMeshes[current.id] = i
            else if (current.components.PhysicsComponent && current.components.SphereCollider)
                r.dynamicPhysicsMeshes[current.id] = i
        }
        if (current.components.CubeMapComponent)
            r.cubeMaps[current.id] = i

    }
    for (let i = 0; i < materials.length; i++) {
        r.materials[materials[i].id] = i
    }

    for (let i = 0; i < meshes.length; i++) {

        r.meshSources[meshes[i].id] = i
    }


    instance.types = r
    if (params.cameraType !== instance.cameraType) {
        instance.cameraType = params.cameraType
        instance.changeCamera()
    }
    instance.params = params
    instance.cameraEvents.stopTracking()
}
