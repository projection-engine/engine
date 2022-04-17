import System from "../basic/System";

import MaterialInstance from "../../instances/MaterialInstance";
import * as shaderCode from '../../shaders/mesh/meshDeferred.glsl'
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import brdfImg from "../../../../static/brdf_lut.jpg";
import {createTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../templates/SYSTEMS";
import COMPONENTS from "../../templates/COMPONENTS";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

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
        brdf.decode().then(() => {
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
            this.fallbackMaterial = new MaterialInstance(
                this.gpu,
                shaderCode.fragment, [
                    {key: 'brdfSampler', data: this.brdf, type: DATA_TYPES.UNDEFINED}
                ],
                () => {
                    console.log('FINISHED')
                    this._ready = true
                })
        })
    }

    execute(options, systems, data) {
        super.execute()
        const {

            meshes,
            skybox,
            materials,
            meshSources,
            translucentMeshes,
            cubeMapsSources,

        } = data

        if (this._ready) {

            const {
                elapsed,
                camera,
                injectMaterial
            } = options
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
                        current.components.MeshComponent.normalMatrix,
                        undefined,
                        current.components.MaterialComponent,

                        ambient.irradianceMap,
                        ambient.prefilteredMap,
                        ambient.prefilteredLod,
                        elapsed
                    )
                }
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
        elapsed
    ) {
        const mat = material && material.ready ? material : this.fallbackMaterial
        const gpu = this.gpu
        mesh.use()
        try {
            mat.use(true, {
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,
                indexSelected,

                brdfSampler: this.brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                irradianceMap: closestIrradiance,
                prefilteredMapSampler: closestPrefiltered,
                ambientLODSamples: prefilteredLod,
                ...(materialComponent.overrideTiling ? materialComponent.uniformValues : {})
            })


            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
            mesh.finish()
        } catch (e) {
        }

    }
}