import System from "../basic/System";

import * as shaderCode from '../../shaders/mesh/forwardMesh.glsl'
import * as skyShader from '../../shaders/misc/skybox.glsl'
import Shader from "../../utils/workers/Shader";
import SYSTEMS from "../../utils/misc/SYSTEMS";
import CubeMapInstance from "../../instances/CubeMapInstance";
import {createVAO, lookAt} from "../../utils/misc/utils";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import VBO from "../../utils/workers/VBO";
import cube from "../../assets/cube.json";

export default class CubeMapSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.skyShader = new Shader(skyShader.vertex, skyShader.fragment, gpu)

        this.vao = createVAO(gpu)
        this.vbo = new VBO(gpu, 0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
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
            translucentMeshes
        } = data


        if (!this._compiled || options.recompile) {
            console.log('REBUILDING')
            const meshSystem = systems[SYSTEMS.MESH]

            this.gpu.clearDepth(1);
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
                lPosition = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.position),
                lColor = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.fixedColor),
                lAttenuation = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.attenuation)
            for (let i = 0; i < cubeMaps.length; i++) {
                const current = cubeMaps[i].components.CubeMapComponent
                if(current.cubeMap) {
                    current.cubeMap.generateIrradiance()
                    current.cubeMap.generatePrefiltered(current.prefilteredMipmaps, current.resolution)
                }
            }


            for (let i = 0; i < cubeMaps.length; i++) {
                const current = cubeMaps[i].components.CubeMapComponent

                if (!current.cubeMap)
                    current.cubeMap = new CubeMapInstance(this.gpu, current.resolution)

                current.cubeMap.resolution = current.resolution
                current.cubeMap.draw((yaw, pitch, projection, index) => {
                        const target = vec3.add([], current.position, VIEWS.target[index])
                        const view = mat4.lookAt([], current.position, target, VIEWS.up[index])
                        const nView = [...view]
                        nView[12] = nView[13] = nView[14] = 0

                    if(skybox) {
                        this.gpu.depthMask(false)
                        this.skyShader.use()
                        this.gpu.bindVertexArray(this.vao)
                        this.vbo.enable()
                        this.skyShader.bindForUse({
                            uTexture: skybox?.cubeMap,
                            projectionMatrix: projection,
                            viewMatrix: nView,
                            gamma: skybox?.gamma,
                            exposure: skybox?.exposure
                        })

                        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
                        this.vbo.disable()
                        this.gpu.depthMask(true)
                    }
                        this.shader.use()
                        this._loopMeshes(
                            view,
                            projection,
                            current.position,
                            meshSystem,
                            materials,
                            translucentMeshes,
                            meshSources,
                            meshes,

                            pointLightsQuantity,
                            maxTextures,
                            dirLights,
                            dirLightsPov,
                            lClip,
                            lPosition,
                            lColor,
                            lAttenuation
                        )
                    },
                    false,
                    10000, 1)

                // current.cubeMap.generateIrradiance()
                // current.cubeMap.generatePrefiltered(current.prefilteredMipmaps, current.resolution)

                current.compiled = true
            }


            if (options.recompile)
                options.setRecompile(false)
            this._compiled = true
        }
    }

    _loopMeshes(
        view,
        projection,
        cubeMapPosition,
        meshSystem,
        materials,
        translucentMeshes,
        meshSources,
        meshes,
        pointLightsQuantity,
        maxTextures,
        dirLights,
        dirLightsPov,
        lClip,
        lPosition,
        lColor,
        lAttenuation
    ) {
        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components.MeshComponent.meshID]
            if (mesh !== undefined && !translucentMeshes[current.id]) {
                const t = current.components.TransformComponent
                const currentMaterial = materials[current.components.MaterialComponent.materialID]

                let mat = currentMaterial ? currentMaterial : meshSystem.fallbackMaterial
                if (!mat || !mat.ready)
                    mat = meshSystem.fallbackMaterial

                this._drawMesh(
                    mesh,
                    cubeMapPosition,
                    view,
                    projection,
                    t.transformationMatrix,
                    mat,
                    current.components.MeshComponent.normalMatrix,
                    current.components.MaterialComponent,
                    meshSystem.brdf,

                    pointLightsQuantity,
                    maxTextures,
                    dirLights,
                    dirLightsPov,
                    lClip,
                    lPosition,
                    lColor,
                    lAttenuation
                )
            }
        }

    }

    _drawMesh(
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
        lAttenuation
    ) {

        const gpu = this.gpu
        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()

        this.shader.bindForUse({
            pbrMaterial: {
                albedo: material.albedo.texture,
                metallic: material.metallic.texture,
                roughness: material.roughness.texture,
                normal: material.normal.texture,
                height: material.height.texture,
                ao: material.ao.texture,
                emissive: material.emissive.texture
            },

            uvScale: materialComponent.overrideTiling ? materialComponent.tiling : material.uvScale,
            projectionMatrix,
            transformMatrix,
            viewMatrix,
            cameraVec: camPosition,
            normalMatrix,
            brdfSampler: brdf,

            dirLightQuantity: maxTextures,
            directionalLights: dirLights,
            directionalLightsPOV: dirLightsPov,

            lightQuantity: pointLightsQuantity,
            lightClippingPlane: lClip,
            lightPosition: lPosition,
            lightColor: lColor,
            lightAttenuationFactors: lAttenuation

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