import System from "../basic/System";
import FramebufferInstance from "../instances/FramebufferInstance";
import SYSTEMS from "../templates/SYSTEMS";
import COMPONENTS from "../templates/COMPONENTS";

export default class GBufferSystem extends System {
    lastMaterial

    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({attachment: 0, precision: this.gpu.RGBA32F, format: this.gpu.RGBA, type: this.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .texture({attachment: 5})
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

                this.drawMesh(
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat,
                    current.components[COMPONENTS.MESH].normalMatrix,
                    undefined,
                    current.components[COMPONENTS.MATERIAL],

                    ambient.irradianceMap,
                    ambient.prefilteredMap,
                    ambient.prefilteredLod,
                    elapsed,
                    brdf
                )
            }
        }
        this.frameBuffer.stopMapping()
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


        if (material && !material.settings?.isForwardShaded) {

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

            if (material.settings?.doubleSided)
                this.gpu.disable(this.gpu.CULL_FACE)
            else if(material.settings?.cullFace)
                this.gpu.cullFace(this.gpu[material.settings?.cullFace])
            if (material.settings?.depthMask === false)
                this.gpu.depthMask(false)
            if (material.settings?.depthTest === false)
                this.gpu.disable(this.gpu.DEPTH_TEST)
            if (material.settings?.blend === false)
                this.gpu.disable(this.gpu.BLEND)
            else if(material.settings?.blendFunc)
                this.gpu.blendFunc(this.gpu[material.settings?.blendFuncSource], this.gpu[material.settings?.blendFuncTarget])

            this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

            if (material.settings?.doubleSided)
                this.gpu.enable(this.gpu.CULL_FACE)
            if (material.settings?.depthMask === false)
                this.gpu.depthMask(true)
            if (material.settings?.depthTest === false)
                this.gpu.enable(this.gpu.DEPTH_TEST)
            if (material.settings?.blend === false)
                this.gpu.enable(this.gpu.BLEND)

            mesh.finish()
        }
    }
}