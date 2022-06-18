import System from "../basic/System"
import {mat4, vec3} from "gl-matrix"
import {VIEWS} from "./ShadowMapSystem"
import COMPONENTS from "../templates/COMPONENTS"
import Forward from "./Forward"
import Renderer from "../Renderer"

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
        super()
        this.gpu = gpu
    }


    execute(options, systems, data) {
        super.execute()
        const {
            cubeMaps,
            meshes,
            cubeBuffer
        } = data

        if (this.lastCallLength !== cubeMaps.length) {
            this.step = STEPS_CUBE_MAP.BASE
            this.lastCallLength = cubeMaps.length
        }
        switch (this.step) {
        case STEPS_CUBE_MAP.BASE:
            for (let i = 0; i < this.lastCallLength; i++) {
                const current = cubeMaps[i].components[COMPONENTS.CUBE_MAP]
                current.cubeMap.resolution = current.resolution
                const translation = cubeMaps[i].components[COMPONENTS.TRANSFORM].translation
                current.cubeMap.draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], translation, VIEWS.target[index])
                    const view = mat4.lookAt([], translation, target, VIEWS.up[index])
                    CubeMapSystem.draw({
                        view,
                        projection,
                        data,
                        options,
                        cubeMapPosition: translation,
                        gpu: this.gpu
                    })
                },
                undefined,
                10000,
                1
                )
            }
            this.gpu.bindVertexArray(null)
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

    sort(
        meshes,
        cubeMaps
    ) {
        for (let meshIndex in meshes) {
            let intersecting
            const currentMesh = meshes[meshIndex]
            for (let index in cubeMaps) {
                const probePosition = cubeMaps[index].components[COMPONENTS.TRANSFORM].translation
                const mPosition = currentMesh.components[COMPONENTS.TRANSFORM].translation
                const distance = vec3.len(vec3.subtract([], probePosition, mPosition))
                if (!intersecting || distance < intersecting.distance)
                    intersecting = {
                        prefilteredMipmaps: cubeMaps[index].components[COMPONENTS.CUBE_MAP].prefilteredMipmaps - 1,
                        prefilteredMap: cubeMaps[index].components[COMPONENTS.CUBE_MAP].prefilteredMap,
                        distance,
                        irradianceMultiplier: [1, 1, 1]
                    }
            }

            if (intersecting) {
                const target = currentMesh.components[COMPONENTS.MATERIAL].cubeMap

                target.ready = true
                target.prefiltered = intersecting.prefilteredMap
                target.prefilteredLod = intersecting.prefilteredMipmaps

            }
        }
    }

    static draw({
        view,
        projection,
        cubeMapPosition,
        data,
        options,
        gpu
    }) {
        const {
                meshes, materials, meshSources, directionalLightsData,
                dirLightPOV, pointLightsQuantity, pointLightData,
                maxTextures
            } = data,
            {fallbackMaterial, brdf, elapsed} = options,
            l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial
                const ambient = Renderer.getEnvironment(current)
                console.log(ambient)
                Forward.drawMesh({
                    ambient,
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
                    useCubeMapShader: true,
                    onlyForward: true
                })
            }
        }
        gpu.bindVertexArray(null)
    }
}