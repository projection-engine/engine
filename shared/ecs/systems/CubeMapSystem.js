import System from "../basic/System";

import * as shaderCode from '../../shaders/mesh/forwardMesh.glsl'
import * as skyShader from '../../shaders/misc/skybox.glsl'
import Shader from "../../utils/workers/Shader";
import SYSTEMS from "../../templates/SYSTEMS";
import {createVAO} from "../../utils/misc/utils";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import VBO from "../../utils/workers/VBO";
import cube from "../../../utils/cube.json";
import {intersectBoundingSphere} from "./PhysicsSystem";
import COMPONENTS from "../../templates/COMPONENTS";

export const STEPS_CUBE_MAP = {
    BASE: 0,

    DONE: 3,
    CALCULATE: 4
}
export default class CubeMapSystem extends System {
    step = STEPS_CUBE_MAP.BASE
    lastCallLength = -1
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
            cubeMaps,
            skybox,
        } = data

        // RADIUS 10
        if (this.lastCallLength !== cubeMaps.length) {
            this.step = STEPS_CUBE_MAP.BASE
            this.lastCallLength = cubeMaps.length
        }
        // if (this.lastMeshLength !== meshes.length) {
        //     this.lastMeshLength = meshes.length
        //     this.step = STEPS_CUBE_MAP.CALCULATE
        // }
        if (this.step !== STEPS_CUBE_MAP.DONE && (skybox && skybox.cubeMap || !skybox))
            this.regenerate(data, options, systems)
    }

    regenerate(data, options, systems) {
        const {
            cubeMaps,
            meshes
        } = data
        switch (this.step) {
            case STEPS_CUBE_MAP.BASE:
                this._generateBaseTexture(options, systems, data)
                for (let i = 0; i < cubeMaps.length; i++) {
                    const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
                    current.cubeMap.generateIrradiance()
                }
                for (let i = 0; i < cubeMaps.length; i++) {
                    const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
                    current.cubeMap.generatePrefiltered(current.prefilteredMipmaps, current.resolution)
                }
                this.step = STEPS_CUBE_MAP.CALCULATE
                console.log('HERE')
                break

            case STEPS_CUBE_MAP.CALCULATE:

                const changedMeshes = meshes
                let newCubeMaps = {}

                for (let i = 0; i < cubeMaps.length; i++) {
                    const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP],
                        pos = cubeMaps[i].components.TransformComponent.position,
                        radius = current.radius

                    for (let m = 0; m < changedMeshes.length; m++) {

                        const currentMesh = changedMeshes[m].components
                        if (intersectBoundingSphere(currentMesh[COMPONENTS.MATERIAL].radius, radius, currentMesh[COMPONENTS.TRANSFORM].position.slice(0, 3), pos))
                            newCubeMaps[changedMeshes[m].id] = cubeMaps[i].id
                    }
                }
                this.cubeMapsConsumeMap = newCubeMaps
                this.step = STEPS_CUBE_MAP.DONE
                break
            default:
                this.step = STEPS_CUBE_MAP.DONE
                break
        }
    }

    _generateBaseTexture(options, systems, data) {
        const {
            pointLights,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,
            translucentMeshes
        } = data
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
            lPosition = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.TransformComponent.position),
            lColor = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.fixedColor),
            lAttenuation = (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.attenuation)

        for (let i = 0; i < cubeMaps.length; i++) {
            const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
            current.cubeMap.resolution = current.resolution
            current.cubeMap.draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], cubeMaps[i].components.TransformComponent.position, VIEWS.target[index])
                    const view = mat4.lookAt([], cubeMaps[i].components.TransformComponent.position, target, VIEWS.up[index])
                    const nView = [...view]
                    nView[12] = nView[13] = nView[14] = 0

                    if (skybox && skybox.cubeMap) {
                        this.gpu.depthMask(false)
                        this.skyShader.use()
                        this.gpu.bindVertexArray(this.vao)
                        this.vbo.enable()
                        this.skyShader.bindForUse({
                            uTexture: skybox?.cubeMap.texture,
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
                        cubeMaps[i].components.TransformComponent.position,
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
                10000,
                1
            )
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
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined && !translucentMeshes[current.id]) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

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
        // TODO - USE MESH MATERIAL SHADER
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

            uvScale: materialComponent.overrideMaterial ? materialComponent.tiling : material.uvScale,
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