import System from "../../basic/System"
import {mat4, vec3} from "gl-matrix"
import {VIEWS} from "./ShadowMapPass"
import COMPONENTS from "../../templates/COMPONENTS"
import ForwardPass from "./ForwardPass"
import CubeMapInstance from "../../instances/CubeMapInstance"

export const STEPS_CUBE_MAP = {
    BASE: 0,
    PRE_FILTERED: 1,

    DONE: 2,
    CALCULATE: 3
}
export default class SpecularProbePass extends System {
    step = STEPS_CUBE_MAP.BASE
    lastCallLength = -1
    probes = {}
    specularProbes = {}

    constructor() {
        super()
    }

    execute(options, data) {
        super.execute()
        const {
            specularProbes,
            meshes,
            cubeBuffer
        } = data

        if (this.lastCallLength !== specularProbes.length) {
            this.step = STEPS_CUBE_MAP.BASE
            this.lastCallLength = specularProbes.length
        }
        switch (this.step) {
        case STEPS_CUBE_MAP.BASE:
            for (let i = 0; i < this.lastCallLength; i++) {
                const current = specularProbes[i]
                if(!current.active)
                    continue
                const component = current.components[COMPONENTS.PROBE]
                if(!this.specularProbes[current.id])
                    this.specularProbes[current.id] = new CubeMapInstance(component.resolution, false)
                else
                    this.specularProbes[current.id].resolution = component.resolution
                const translation = specularProbes[i].components[COMPONENTS.TRANSFORM].translation
                this.specularProbes[current.id].draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], translation, VIEWS.target[index])
                    const view = mat4.lookAt([], translation, target, VIEWS.up[index])
                    SpecularProbePass.draw({
                        view,
                        projection,
                        data,
                        options,
                        cubeMapPosition: translation
                    })
                },
                undefined,
                10000,
                1
                )
            }
            window.gpu.bindVertexArray(null)
            this.step = STEPS_CUBE_MAP.PRE_FILTERED
            break
        case STEPS_CUBE_MAP.PRE_FILTERED:
            for (let i = 0; i < this.lastCallLength; i++) {
                if(!specularProbes[i].active)
                    continue
                const current = specularProbes[i].components[COMPONENTS.PROBE]
                this.specularProbes[specularProbes[i].id].generatePrefiltered(current.mipmaps, current.resolution, cubeBuffer, current.multiplier)
            }
            this.step = STEPS_CUBE_MAP.CALCULATE
            break
        case STEPS_CUBE_MAP.CALCULATE:
            this.sort(meshes, specularProbes)
            this.step = STEPS_CUBE_MAP.DONE
            break
        default:
            this.step = STEPS_CUBE_MAP.DONE
            break
        }
    }

    sort(meshes, specularProbes) {
        for (let meshIndex in meshes) {
            let intersecting
            const currentMesh = meshes[meshIndex]
            for (let index in specularProbes) {
                const probePosition = specularProbes[index].components[COMPONENTS.TRANSFORM].translation
                const mPosition = currentMesh.components[COMPONENTS.TRANSFORM].translation
                const distance = vec3.len(vec3.subtract([], probePosition, mPosition))
                const component = specularProbes[index].components[COMPONENTS.PROBE]
                if (!intersecting || distance < intersecting.distance)
                    intersecting = {
                        mipmaps: component.mipmaps - 1,
                        texture: this.specularProbes[specularProbes[index].id].prefiltered,
                        distance,
                        multiplier: component.multiplier
                    }
            }

            if (intersecting) {
                this.probes[currentMesh.id] = {}
                this.probes[currentMesh.id].texture = intersecting.texture
                this.probes[currentMesh.id].mipmaps = intersecting.mipmaps
            }
        }
    }

    static draw({
        view,
        projection,
        cubeMapPosition,
        data,
        options,
    }) {
        const {
                meshes, materials, meshesMap, directionalLightsData,
                dirLightPOV, pointLightsQuantity, pointLightData,
                maxTextures
            } = data,
            {fallbackMaterial, brdf, elapsed} = options,
            l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshesMap.get(current.components[COMPONENTS.MESH].meshID)
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial
                const ambient = window.renderer.getEnvironment(current)
                ForwardPass.drawMesh({
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
                    useCubeMapShader: true,
                    onlyForward: true
                })
            }
        }
        window.gpu.bindVertexArray(null)
    }
}