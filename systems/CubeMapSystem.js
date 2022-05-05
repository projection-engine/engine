import System from "../basic/System";


import * as skyShader from '../shaders/misc/skybox.glsl'
import ShaderInstance from "../instances/ShaderInstance";
import {createVAO} from "../utils/utils";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import VBO from "../instances/VBO";
import cube from "../utils/cube.json";
import {intersectBoundingSphere} from "./PhysicsSystem";
import COMPONENTS from "../templates/COMPONENTS";

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
        this.skyShader = new ShaderInstance(skyShader.vertex, skyShader.fragment, gpu)
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
                break

            case STEPS_CUBE_MAP.CALCULATE:

                const changedMeshes = meshes
                let newCubeMaps = {}

                for (let i = 0; i < cubeMaps.length; i++) {
                    const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP],
                        pos = cubeMaps[i].components[COMPONENTS.TRANSFORM].position,
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
            translucentMeshes,

            maxTextures,

            dirLights,
            dirLightPOV,

            pointLightsQuantity,
            pointLightData,
        } = data

        const  {
            fallbackMaterial,
            brdf
        } = options

        this.gpu.clearDepth(1);

        for (let i = 0; i < cubeMaps.length; i++) {
            const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
            current.cubeMap.resolution = current.resolution
            current.cubeMap.draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], cubeMaps[i].components[COMPONENTS.TRANSFORM].position, VIEWS.target[index])
                    const view = mat4.lookAt([], cubeMaps[i].components[COMPONENTS.TRANSFORM].position, target, VIEWS.up[index])
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
                        cubeMaps[i].components[COMPONENTS.TRANSFORM].position,
                        fallbackMaterial,
                        brdf,
                        materials,
                        translucentMeshes,
                        meshSources,
                        meshes,
                        maxTextures,
                        dirLights,
                        dirLightPOV,
                        pointLightsQuantity,
                        pointLightData,
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
        fallbackMaterial,
        brdf,
        materials,
        translucentMeshes,
        meshSources,
        meshes,

        maxTextures,
        dirLights,
        dirLightPOV,
        pointLightsQuantity,
        pointLightData,
    ) {
        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined && !translucentMeshes[current.id]) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial

                this._drawMesh(
                    mesh,
                    cubeMapPosition,
                    view,
                    projection,
                    t.transformationMatrix,
                    mat,
                    current.components[COMPONENTS.MESH].normalMatrix,
                    current.components[COMPONENTS.MATERIAL],
                    brdf,
                    maxTextures,
                    dirLights,
                    dirLightPOV,
                    pointLightsQuantity,
                    pointLightData,
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
        maxTextures,
        dirLights,
        dirLightPOV,
        pointLightsQuantity,
        pointLightData,
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
            dirLightPOV,

            lightQuantity: pointLightsQuantity,
            pointLightsQuantity,
            pointLightData,

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