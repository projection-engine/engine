import System from "../../basic/System";

import * as shaderCode from '../../../shaders/mesh/forwardMesh.glsl'
import * as skyShader from '../../../shaders/misc/skybox.glsl'
import Shader from "../../../utils/workers/Shader";
import {createVAO} from "../../../utils/misc/utils";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import VBO from "../../../utils/workers/VBO";
import cube from "../../../../utils/cube.json";
import {intersectBoundingSphere} from "../utils/PhysicsSystem";
import COMPONENTS from "../../../templates/COMPONENTS";
import SYSTEMS from "../../../templates/SYSTEMS";

export default class ForwardSystem extends System {
    lastMaterial
    cubeMapsConsumeMap = {}

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.skyShader = new Shader(skyShader.vertex, skyShader.fragment, gpu)

        this.vao = createVAO(gpu)
        this.vbo = new VBO(gpu, 0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        gpu.bindVertexArray(null)
    }


    execute(options, systems, data) {
        super.execute()
        const {
            meshes,
            skybox,
            materials,
            meshSources,
            cubeMapsSources,
            pointLights,
            directionalLights
        } = data

        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf
        } = options
        const toConsumeCubeMaps = systems[SYSTEMS.CUBE_MAP]?.cubeMapsConsumeMap
        this.lastMaterial = undefined

        const dirLightsE = directionalLights.map(d => d.components.DirectionalLightComponent)
        let maxTextures = dirLightsE.length > 2 ? 2 : dirLightsE.length,
            pointLightsQuantity = (pointLights.length > 4 ? 4 : pointLights.length)
        const dirLights = (new Array(maxTextures).fill(null)).map((_, i) => {
            return {
                direction: dirLightsE[i].direction,
                ambient: dirLightsE[i].fixedColor,
                atlasFace: dirLightsE[i].atlasFace
            }
        })
        const dirLightsPov = (new Array(maxTextures).fill(null)).map((_, i) => {
            return {
                lightViewMatrix: dirLightsE[i].lightView,
                lightProjectionMatrix: dirLightsE[i].lightProjection
            }
        })
        let lClip = (new Array(pointLightsQuantity).fill(null)).map((_, i) => [pointLights[i].components.PointLightComponent.zNear, pointLights[i].components.PointLightComponent.zFar]),
            lPosition = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.TransformComponent.position),
            lColor = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.fixedColor),
            lAttenuation = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.attenuation)


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
                    current.components.MaterialComponent,
                    brdf,

                    pointLightsQuantity,
                    maxTextures,
                    dirLights,
                    dirLightsPov,
                    lClip,
                    lPosition,
                    lColor,
                    lAttenuation,



                    elapsed,
                    ambient.irradianceMap,
                    ambient.prefilteredMap,
                    ambient.prefilteredLod,
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
        pointLightsQuantity,
        maxTextures,
        dirLights,
        dirLightsPov,
        lClip,
        lPosition,
        lColor,
        lAttenuation,

        elapsed,
        closestIrradiance,
        closestPrefiltered,
        prefilteredLod
    ) {

        if (material && material.settings?.isForwardShaded) {

            const gpu = this.gpu
            mesh.use()

            material.use(this.lastMaterial !== material.id, {
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,

                brdfSampler: brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                irradianceMap: closestIrradiance,
                prefilteredMapSampler: closestPrefiltered,
                ambientLODSamples: prefilteredLod,

                dirLightQuantity: maxTextures,
                directionalLights: dirLights,
                directionalLightsPOV: dirLightsPov,

                lightQuantity: pointLightsQuantity,
                lightClippingPlane: lClip,
                lightPosition: lPosition,
                lightColor: lColor,
                lightAttenuationFactors: lAttenuation,
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