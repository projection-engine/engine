import System from "../basic/System";
import COMPONENTS from "../templates/COMPONENTS";
import SYSTEMS from "../templates/SYSTEMS";

export default class ForwardSystem extends System {
    lastMaterial
    cubeMapsConsumeMap = {}

    constructor(gpu) {
        super([]);
        this.gpu = gpu
    }
    execute(options, systems, data, sceneColor) {
        super.execute()
        const {
            meshes,
            skybox,
            materials,
            meshSources,
            cubeMapsSources,
            pointLightsQuantity,
            maxTextures,
            dirLights,
            dirLightsPov,
            pointLightData,

        } = data

        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf
        } = options
        const toConsumeCubeMaps = systems[SYSTEMS.CUBE_MAP]?.cubeMapsConsumeMap
        this.lastMaterial = undefined



        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial
                const c = toConsumeCubeMaps ? toConsumeCubeMaps[current.id] : undefined
                let cubeMapToApply, ambient = {}

                if (c)
                    cubeMapToApply = cubeMapsSources[c]
                if (cubeMapToApply) {
                    const cube = cubeMapToApply.components[COMPONENTS.CUBE_MAP]
                    ambient.irradianceMap = cube.irradiance ? cube.irradianceMap : skybox?.cubeMap.irradianceTexture
                    ambient.prefilteredMap = cube.prefilteredMap
                    ambient.prefilteredLod = cube.prefilteredMipmaps
                } else if (skybox && skybox.cubeMap !== undefined) {
                    ambient.irradianceMap = skybox?.cubeMap.irradianceTexture
                    ambient.prefilteredMap = skybox?.cubeMap.prefiltered
                    ambient.prefilteredLod = 6
                }

                this.drawMesh(
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat,
                    current.components[COMPONENTS.MESH].normalMatrix,
                    current.components[COMPONENTS.MATERIAL],
                    brdf,


                    maxTextures,
                    dirLights,
                    dirLightsPov,

                    pointLightsQuantity,
                    pointLightData,

                    elapsed,
                    ambient.irradianceMap,
                    ambient.prefilteredMap,
                    ambient.prefilteredLod,
                    sceneColor
                )
            }
        }
    }

    drawMesh(
        mesh,
        camPosition,
        viewMatrix,
        projectionMatrix,
        transformMatrix,
        material,
        normalMatrix,
        materialComponent,
        brdf,

        maxTextures,
        dirLights,
        dirLightPOV,
        pointLightsQuantity,
        pointLightData,

        elapsed,
        closestIrradiance,
        closestPrefiltered,
        prefilteredLod,
        sceneColor
    ) {

        if (material && material.settings?.isForwardShaded) {
            mesh.use()
            material.use(this.lastMaterial !== material.id, {
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,
                sceneColor,
                brdfSampler: brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                irradianceMap: closestIrradiance,
                prefilteredMapSampler: closestPrefiltered,
                ambientLODSamples: prefilteredLod,

                dirLightQuantity: maxTextures,
                directionalLights: dirLights,
                dirLightPOV,

                lightQuantity: pointLightsQuantity,
                pointLightData,
                ...(materialComponent.overrideMaterial ? materialComponent.uniformValues : {})
            })


            this.lastMaterial = material.id
            if (material.settings?.doubleSided)
                this.gpu.disable(this.gpu.CULL_FACE)
            else if(material.settings?.cullFace)
                this.gpu.cullFace(this.gpu[material.settings?.cullFace])
            if (!material.settings?.depthMask)
                this.gpu.depthMask(false)
            if (!material.settings?.depthTest)
                this.gpu.disable(this.gpu.DEPTH_TEST)
            if (!material.settings?.blend)
                this.gpu.disable(this.gpu.BLEND)
            else if(material.settings?.blendFunc)
                this.gpu.blendFunc(this.gpu[material.settings?.blendFuncSource], this.gpu[material.settings?.blendFuncTarget])

            this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

            if (material.settings?.doubleSided)
                this.gpu.enable(this.gpu.CULL_FACE)
            if (!material.settings?.depthMask)
                this.gpu.depthMask(true)
            if (!material.settings?.depthTest)
                this.gpu.enable(this.gpu.DEPTH_TEST)
            if (!material.settings?.blend)
                this.gpu.enable(this.gpu.BLEND)
            mesh.finish()
        }
    }
}