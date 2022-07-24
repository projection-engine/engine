export default function bindMaterial(mesh, material) {

    // if (material.settings.faceCulling === false)
    //     gpu.disable(gpu.CULL_FACE)
    // else {
    //     gpu.enable(gpu.CULL_FACE)
    //     if(material.settings.cullBackFace)
    //         gpu.cullFace(gpu.BACK)
    //     else
    //         gpu.cullFace(gpu.FRONT)
    // }
    if (material.settings.depthMask === false)
        gpu.depthMask(false)
    if (material.settings.depthTest === false)
        gpu.disable(gpu.DEPTH_TEST)
    if (material.settings.blend === false)
        gpu.disable(gpu.BLEND)
    else if (material.settings.blendFunc)
        gpu.blendFunc(gpu[material.settings.blendFuncSource], gpu[material.settings?.blendFuncTarget])

    gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

    if (material.settings.depthMask === false)
        gpu.depthMask(true)
    if (material.settings.depthTest === false)
        gpu.enable(gpu.DEPTH_TEST)
    if (material.settings.blend === false)
        gpu.enable(gpu.BLEND)

}