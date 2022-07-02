import System from "../../basic/System"
import {mat4, vec3} from "gl-matrix"
import {VIEWS} from "./ShadowMapPass"
import COMPONENTS from "../../templates/COMPONENTS"
import SpecularProbePass from "./SpecularProbePass"
import CubeMapInstance from "../../instances/CubeMapInstance"

export const STEPS_LIGHT_PROBE = {
    GENERATION: 0,

    DONE: 3,
    CALCULATE: 4
}
export default class DiffuseProbePass extends System {
    step = STEPS_LIGHT_PROBE.GENERATION
    lastCallLength = -1
    probes = {}
    specularProbes = {}
    constructor() {
        super()
        this.baseCubeMap = new CubeMapInstance(128)
    }

    execute(options, data) {

        const {
            diffuseProbes,
            meshes,
            skybox,
            cubeBuffer,
            skyboxShader
        } = data

        if (this.lastCallLength !== diffuseProbes.length) {
            this.step = STEPS_LIGHT_PROBE.GENERATION
            this.lastCallLength = diffuseProbes.length
        }
        switch (this.step) {

        case STEPS_LIGHT_PROBE.GENERATION:
            for (let i = 0; i < diffuseProbes.length; i++) {
                const current = diffuseProbes[i]
                const transformation = diffuseProbes[i].components[COMPONENTS.TRANSFORM]
                this.baseCubeMap.draw((yaw, pitch, projection, index) => {
                    const target = vec3.add([], transformation.translation, VIEWS.target[index])
                    const view = mat4.lookAt([], transformation.translation, target, VIEWS.up[index])
                    SpecularProbePass.draw({
                        view,
                        projection,
                        data,
                        options,
                        cubeMapPosition: transformation.translation,
                        skybox,
                        cubeBuffer,
                        skyboxShader
                    })

                },
                undefined,
                10000,
                1
                )
                if(!this.specularProbes[current.id]) {
                    this.specularProbes[current.id]
                    this.specularProbes[current.id] = new CubeMapInstance(32)
                }
                this.specularProbes[current.id].generateIrradiance(cubeBuffer, this.baseCubeMap.texture, current.components[COMPONENTS.PROBE].multiplier)
            }

            this.step = STEPS_LIGHT_PROBE.CALCULATE
            break
        case STEPS_LIGHT_PROBE.CALCULATE:
            this.sort(diffuseProbes, meshes)
            this.step = STEPS_LIGHT_PROBE.DONE
            break
        default:
            this.step = STEPS_LIGHT_PROBE.DONE
            break
        }
    }

    sort(
        probes,
        meshes
    ) {
        const MAX_PROBES = 4
        for (let meshIndex in meshes) {
            const intersecting = []
            const currentMesh = meshes[meshIndex]
            const mPosition = currentMesh.components[COMPONENTS.TRANSFORM].translation
            for (let probeIndex in probes) {
                const current = probes[probeIndex]
                const component = probes[probeIndex].components[COMPONENTS.PROBE]
                const probePosition = current.components[COMPONENTS.TRANSFORM].translation
                const texture = this.specularProbes[current.id].irradianceTexture

                if (intersecting.length < MAX_PROBES) {
                    intersecting.push({
                        ref: texture,
                        distance: vec3.len(vec3.subtract([], probePosition, mPosition)),
                        multiplier: component.multiplier
                    })
                } else {
                    const currentDistance = vec3.len(vec3.subtract([], probePosition, mPosition))
                    for (let intIndex in intersecting) {
                        if (currentDistance < intersecting[intIndex].distance) {
                            intersecting[intIndex] = {
                                ref: texture,
                                distance: currentDistance,
                                multiplier: component.multiplier
                            }
                            break
                        }
                    }
                }
            }
            if (intersecting.length > 0) {
                const sorted = intersecting.sort((a, b) => a.distance - b.distance)
                this.probes[currentMesh.id] = []
                for(let i = 0; i < sorted.length; i++){
                    this.probes[currentMesh.id][i] = {}
                    this.probes[currentMesh.id][i].texture = sorted[i].ref
                    this.probes[currentMesh.id][i].multiplier = sorted[i].multiplier
                }
            }
        }
    }
}


