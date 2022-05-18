import System from "../basic/System";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import {intersectBoundingSphere} from "./PhysicsSystem";
import COMPONENTS from "../templates/COMPONENTS";
import ForwardSystem from "./ForwardSystem";
import SkyboxSystem from "./SkyboxSystem";

export const STEPS_CUBE_MAP = {
    BASE: 0,
    PRE_FILTERED: 1,

    DONE: 2,
    CALCULATE: 3
}
export default class CubeMapSystem extends System {
    step = STEPS_CUBE_MAP.BASE
    lastCallLength = -1

    constructor(gpu) {
        super([]);
        this.gpu = gpu
    }


    execute(options, systems, data) {
        super.execute()
        const {
            cubeMaps,
            meshes,
            cubeBuffer
        } = data
        // RADIUS 10
        if (this.lastCallLength !== cubeMaps.length) {
            this.step = STEPS_CUBE_MAP.BASE
            this.lastCallLength = cubeMaps.length
        }
        // TODO - use single base texture
        switch (this.step) {
            case STEPS_CUBE_MAP.BASE:
                this.#generateBaseTexture(options, systems, data)
                this.step = STEPS_CUBE_MAP.PRE_FILTERED
                break
            case STEPS_CUBE_MAP.PRE_FILTERED:
                for (let i = 0; i < this.lastCallLength; i++) {
                    const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
                    current.cubeMap.generatePrefiltered(current.prefilteredMipmaps, current.resolution, cubeBuffer)
                }
                this.step = STEPS_CUBE_MAP.CALCULATE
                break
            case STEPS_CUBE_MAP.CALCULATE:
                this.sort(meshes, cubeMaps)
                this.step = STEPS_CUBE_MAP.DONE
                break
            default:
                this.step = STEPS_CUBE_MAP.DONE
                break
        }
    }

    sort(meshes, cubeMaps) {
        const l = cubeMaps.length
        const lm = meshes.length
        for (let i = 0; i < l; i++) {
            const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP],
                pos = cubeMaps[i].components[COMPONENTS.TRANSFORM].position,
                radius = current.radius

            for (let m = 0; m < lm; m++) {
                const currentMesh = meshes[m].components
                if (intersectBoundingSphere(currentMesh[COMPONENTS.MATERIAL].radius, radius, currentMesh[COMPONENTS.TRANSFORM].position.slice(0, 3), pos)) {
                    const cube = cubeMaps[i].components[COMPONENTS.CUBE_MAP]

                    const target = meshes[m].components[COMPONENTS.MATERIAL].cubeMap

                    target.prefilteredMap = cube.prefilteredMap
                    target.prefilteredLod = cube.prefilteredMipmaps - 1
                }
            }
        }
    }

    #generateBaseTexture(options, systems, data) {
        const {
            cubeMaps,
            skybox,
            cubeBuffer,
            skyboxShader
        } = data
        for (let i = 0; i < this.lastCallLength; i++) {
            const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
            current.cubeMap.resolution = current.resolution
            current.cubeMap.draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], cubeMaps[i].components[COMPONENTS.TRANSFORM].position, VIEWS.target[index])
                    const view = mat4.lookAt([], cubeMaps[i].components[COMPONENTS.TRANSFORM].position, target, VIEWS.up[index])
                    CubeMapSystem.draw({
                        view,
                        projection,
                        data,
                        options,
                        cubeMapPosition: cubeMaps[i].components[COMPONENTS.TRANSFORM].translation,
                        skybox,
                        cubeBuffer,
                        skyboxShader,
                        gpu: this.gpu
                    })
                },
                undefined,
                10000,
                1
            )
        }
    }

    static draw({
                    view,
                    projection,
                    cubeMapPosition,
                    data,
                    options,
                    skybox,
                    cubeBuffer,
                    skyboxShader,
                    gpu
                }) {
        const {
            meshes, materials, meshSources, directionalLightsData,
            dirLightPOV, pointLightsQuantity, pointLightData,
            maxTextures
        } = data

        const {fallbackMaterial, brdf, elapsed} = options

        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial

                SkyboxSystem.draw(gpu, skybox, cubeBuffer, view, projection, skyboxShader)
                ForwardSystem.drawMesh({
                    mesh,
                    camPosition: cubeMapPosition,
                    viewMatrix: view,
                    projectionMatrix: projection,
                    transformMatrix: t.transformationMatrix,
                    material: mat,
                    normalMatrix: current.components[COMPONENTS.MESH].normalMatrix,
                    materialComponent: current.components[COMPONENTS.MATERIAL],
                    brdf,

                    directionalLightsQuantity: maxTextures,
                    directionalLightsData,
                    dirLightPOV,
                    pointLightsQuantity,
                    pointLightData,

                    elapsed,
                    gpu: gpu,

                    useCubeMapShader: true
                })
            }
        }
    }
}