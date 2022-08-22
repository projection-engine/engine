import {mat4, vec3} from "gl-matrix"
import {VIEWS} from "./ShadowMapPass"
import COMPONENTS from "../../../data/COMPONENTS"
import CubeMapInstance from "../../instances/CubeMapInstance"
import MaterialRenderer from "../../../services/MaterialRenderer";
import RendererController from "../../../RendererController";

export const STEPS_LIGHT_PROBE = {
    GENERATION: 0,

    DONE: 3,
    CALCULATE: 4
}
export default class DiffuseProbePass {
    step = STEPS_LIGHT_PROBE.GENERATION
    lastCallLength = -1
    probes = {}
    diffuseProbes = {}

    constructor() {
        this.baseCubeMap = new CubeMapInstance(128)
    }

    execute() {
        const {
            diffuseProbes,
            meshes
        } = RendererController.data

        if (this.lastCallLength !== diffuseProbes.length) {
            this.step = STEPS_LIGHT_PROBE.GENERATION
            this.lastCallLength = diffuseProbes.length
        }
        switch (this.step) {

            case STEPS_LIGHT_PROBE.GENERATION:
                for (let i = 0; i < diffuseProbes.length; i++) {
                    const current = diffuseProbes[i]
                    if (!current.active)
                        continue
                    const transformation = diffuseProbes[i].components[COMPONENTS.TRANSFORM]
                    this.baseCubeMap.draw((yaw, pitch, projection, index) => {
                            const target = vec3.add([], transformation.translation, VIEWS.target[index])
                            const view = mat4.lookAt([], transformation.translation, target, VIEWS.up[index])
                            MaterialRenderer.drawProbe(
                                view,
                                projection,
                                transformation.translation
                            )

                        },
                        undefined,
                        10000,
                        1
                    )
                    if (!this.diffuseProbes[current.id]) {
                        this.diffuseProbes[current.id]
                        this.diffuseProbes[current.id] = new CubeMapInstance(32)
                    }
                    this.diffuseProbes[current.id].generateIrradiance(this.baseCubeMap.texture, current.components[COMPONENTS.PROBE].multiplier)
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
                const texture = this.diffuseProbes[current.id].irradianceTexture

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
                for (let i = 0; i < sorted.length; i++) {
                    this.probes[currentMesh.id][i] = {}
                    this.probes[currentMesh.id][i].texture = sorted[i].ref
                    this.probes[currentMesh.id][i].multiplier = sorted[i].multiplier
                }
            }
        }
    }
}


