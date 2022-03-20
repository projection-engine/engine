import System from "../basic/System";

import MaterialInstance from "../../instances/MaterialInstance";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import * as shaderCode from '../../shaders/mesh/meshDeferred.glsl'
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import brdfImg from "../../../../static/brdf_lut.jpg";
import {createTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../utils/misc/SYSTEMS";

export default class MeshSystem extends System {
    _ready = false

    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        // this.gBuffer = new GBuffer(gpu, resolutionMultiplier)

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
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,
            translucentMeshes,
            cubeMapsSources
        } = data

        if (this._ready) {

            const {
                camera,
                selected,
                shadingModel,
                injectMaterial
            } = options


            this.shader.use()
            this.gpu.clearDepth(1);
            this.frameBuffer.startMapping()
            const toConsumeCubeMaps = systems[SYSTEMS.CUBE_MAP]?.cubeMapsConsumeMap

            for (let m = 0; m < meshes.length; m++) {
                const current = meshes[m]
                const mesh = meshSources[current.components.MeshComponent.meshID]
                if (mesh !== undefined && !translucentMeshes[current.id]) {
                    const t = current.components.TransformComponent
                    const currentMaterial = materials[current.components.MaterialComponent.materialID]

                    let mat = currentMaterial ? currentMaterial : injectMaterial && !current.components.MaterialComponent.overrideInjection ? injectMaterial : this.fallbackMaterial
                    if (!mat || !mat.ready)
                        mat = this.fallbackMaterial
                    const c = toConsumeCubeMaps ?toConsumeCubeMaps[current.id] : undefined
                    let cubeMapToApply, ambient = {}

                    if(c)
                        cubeMapToApply =  cubeMapsSources[c]
                    if(cubeMapToApply){
                        ambient.irradianceMap = cubeMapToApply.components.CubeMapComponent.irradianceMap
                        ambient.prefilteredMap = cubeMapToApply.components.CubeMapComponent.prefilteredMap
                        ambient.prefilteredLod = cubeMapToApply.components.CubeMapComponent.prefilteredMipmaps
                    }else{
                        ambient.irradianceMap = skybox?.irradianceMap
                        ambient.prefilteredMap = skybox?.cubeMapPrefiltered
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
            this.frameBuffer.stopMapping(false)
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

        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()
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
                heightScale: material.parallaxHeightScale,
                layers: material.parallaxLayers,

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

        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()


    }
}