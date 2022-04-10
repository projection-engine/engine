import System from "../basic/System";

import MaterialInstance from "../../instances/MaterialInstance";
import * as shaderCode from '../../shaders/mesh/meshDeferred.glsl'
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import brdfImg from "../../../../static/brdf_lut.jpg";
import {createTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../templates/SYSTEMS";
import COMPONENTS from "../../templates/COMPONENTS";

export default class MeshSystem extends System {
    _ready = false

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

        const brdf = new Image()
        brdf.src = brdfImg

        brdf.onload = () => {
            this.brdf = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA32F,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                brdf,
                gpu.LINEAR,
                gpu.LINEAR,
                gpu.CLAMP_TO_EDGE,
                gpu.CLAMP_TO_EDGE
            )
        }
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)

    }

    async initializeTextures() {
        this.fallbackMaterial = new MaterialInstance(this.gpu, undefined, 0)
        await this.fallbackMaterial.initializeTextures()
        this._ready = true
    }



    execute(options, systems, data) {
        super.execute()
        const {

            meshes,
            skybox,
            materials,
            meshSources,
            translucentMeshes,
            cubeMapsSources
        } = data

        if (this._ready) {

            const {
                camera,
                injectMaterial
            } = options


            this.shader.use()

            this.frameBuffer.startMapping()
            const toConsumeCubeMaps = systems[SYSTEMS.CUBE_MAP]?.cubeMapsConsumeMap

            for (let m = 0; m < meshes.length; m++) {
                const current = meshes[m]
                const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
                if (mesh !== undefined && !translucentMeshes[current.id]) {
                    const t = current.components[COMPONENTS.TRANSFORM]
                    const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                    let mat = currentMaterial ? currentMaterial : injectMaterial && !current.components[COMPONENTS.MATERIAL].overrideInjection ? injectMaterial : this.fallbackMaterial
                    if (!mat || !mat.ready)
                        mat = this.fallbackMaterial
                    const c = toConsumeCubeMaps ?toConsumeCubeMaps[current.id] : undefined
                    let cubeMapToApply, ambient = {}

                    if(c)
                        cubeMapToApply =  cubeMapsSources[c]
                    if(cubeMapToApply){
                        ambient.irradianceMap = cubeMapToApply.components[COMPONENTS.CUBE_MAP].irradianceMap
                        ambient.prefilteredMap = cubeMapToApply.components[COMPONENTS.CUBE_MAP].prefilteredMap
                        ambient.prefilteredLod = cubeMapToApply.components[COMPONENTS.CUBE_MAP].prefilteredMipmaps
                    }else if(skybox && skybox.cubeMap !== undefined){
                        ambient.irradianceMap = skybox?.cubeMap.irradianceTexture
                        ambient.prefilteredMap = skybox?.cubeMap.prefiltered
                        ambient.prefilteredLod = 6
                    }

                    MeshSystem.drawMesh(
                        this.shader,
                        this.gpu,
                        mesh,
                        camera.position,
                        camera.viewMatrix,
                        camera.projectionMatrix,
                        t.transformationMatrix,
                        mat,
                        current.components.MeshComponent.normalMatrix,
                        undefined,
                        current.components.MaterialComponent,

                        ambient.irradianceMap,
                        ambient.prefilteredMap,
                        this.brdf,
                        ambient.prefilteredLod
                    )
                }
            }
            this.frameBuffer.stopMapping()
        }

    }

    static drawMesh(
        shader,
        gpu,
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
        brdf,
        prefilteredLod
    ) {

        mesh.use()
        let materialAttrs = {}

        if (material && materialComponent) {
            materialAttrs = {
                pbrMaterial: {
                    albedo: material.albedo.texture,
                    metallic: material.metallic.texture,
                    roughness: material.roughness.texture,
                    normal: material.normal.texture,
                    height: material.height.texture,
                    ao: material.ao.texture,
                    emissive: material.emissive.texture
                },
                heightScale: materialComponent.overrideTiling ? materialComponent.parallaxHeightScale : material.parallaxHeightScale,
                layers: materialComponent.overrideTiling ? materialComponent.parallaxLayers : material.parallaxLayers,

                uvScale: materialComponent.overrideTiling ? materialComponent.tiling : material.uvScale,
            }
        }


        shader.bindForUse({
            ...materialAttrs,
            projectionMatrix,
            transformMatrix,
            viewMatrix,
            cameraVec: camPosition,
            normalMatrix,
            indexSelected,
            brdfSampler: brdf,
            irradianceMap: closestIrradiance,
            prefilteredMapSampler: closestPrefiltered,
            settings: [
                material?.parallaxEnabled ? 1 : 0,
                materialComponent?.discardOffPixels ? 1 : 0,
                closestIrradiance && closestPrefiltered ? 1 : 0
            ],
            ambientLODSamples: prefilteredLod
        })

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        mesh.finish()


    }
}