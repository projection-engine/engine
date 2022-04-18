import System from "../../basic/System";
import FramebufferInstance from "../../../instances/FramebufferInstance";
import SYSTEMS from "../../../templates/SYSTEMS";
import COMPONENTS from "../../../templates/COMPONENTS";

export default class GBufferSystem extends System {
    lastMaterial

    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)
        this.frameBuffer
            .texture(undefined, undefined, 0)
            .texture(undefined, undefined, 1)
            .texture(undefined, undefined, 2)
            .texture(undefined, undefined, 3)
            .texture(undefined, undefined, 4)
            .depthTest()
    }

    execute(options, systems, data) {
        super.execute()
        const {
            meshes,
            skybox,
            materials,
            meshSources,
            cubeMapsSources,
        } = data

        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf
        } = options
        this.frameBuffer.startMapping()
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

                console.trace(fallbackMaterial)
                this.drawMesh(
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat,
                    current.components[COMPONENTS.MESH].normalMatrix,
                    undefined,
                    current.components.MaterialComponent,

                    ambient.irradianceMap,
                    ambient.prefilteredMap,
                    ambient.prefilteredLod,
                    elapsed,
                    brdf
                )
            }
            this.frameBuffer.stopMapping()
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
        indexSelected,
        materialComponent,
        closestIrradiance,
        closestPrefiltered,
        prefilteredLod,
        elapsed,
        brdf
    ) {

        console.log(material)
        if (!material.settings?.isForwardShaded) {
            const gpu = this.gpu
            mesh.use()

            material.use(this.lastMaterial !== material.id, {
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,
                indexSelected,

                brdfSampler: brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                irradianceMap: closestIrradiance,
                prefilteredMapSampler: closestPrefiltered,
                ambientLODSamples: prefilteredLod,
                ...(materialComponent.overrideMaterial ? materialComponent.uniformValues : {})
            })
            this.lastMaterial = material.id
            if (material.doubleSided)
                gpu.disable(gpu.CULL_FACE)
            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
            if (material.doubleSided)
                gpu.enable(gpu.CULL_FACE)
            mesh.finish()
        }
    }
}