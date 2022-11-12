import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import MaterialAPI from "../../lib/rendering/MaterialAPI";
import Engine from "../../Engine";
import CUBE_MAP_VIEWS from "../../static/CUBE_MAP_VIEWS";
import LightProbe from "../../instances/LightProbe";

export const STEPS_LIGHT_PROBE = {
    GENERATION: 0,
    DONE: 3,
    CALCULATE: 4
}
export default class DiffuseProbePass {
    static compile(){
        DiffuseProbePass.step = STEPS_LIGHT_PROBE.GENERATION
    }
    static step = STEPS_LIGHT_PROBE.GENERATION
    static lastCallLength = -1
    static probes = {}
    static diffuseProbes = {}
    static baseCubeMap

    static initialize() {
        DiffuseProbePass.baseCubeMap = new LightProbe(512)
    }

    static execute() {
        const {
            diffuseProbes,
            meshes
        } = Engine.data
        if (!DiffuseProbePass.baseCubeMap)
            return

        if (DiffuseProbePass.lastCallLength !== diffuseProbes.length) {
            DiffuseProbePass.step = STEPS_LIGHT_PROBE.GENERATION
            DiffuseProbePass.lastCallLength = diffuseProbes.length
        }
        switch (DiffuseProbePass.step) {
            case STEPS_LIGHT_PROBE.GENERATION:
                for (let i = 0; i < diffuseProbes.length; i++) {
                    const current = diffuseProbes[i]
                    if (!current.active)
                        continue
                    DiffuseProbePass.baseCubeMap.draw((yaw, pitch, projection, index) => {
                            const target = vec3.add([], current.translation, CUBE_MAP_VIEWS.target[index])
                            const view = mat4.lookAt([], current.translation, target, CUBE_MAP_VIEWS.up[index])
                            MaterialAPI.drawProbe(
                                view,
                                projection,
                                current.translation
                            )
                        },
                        10000,
                        1
                    )
                    if (!DiffuseProbePass.diffuseProbes[current.id])
                        DiffuseProbePass.diffuseProbes[current.id] = new LightProbe()

                    DiffuseProbePass.diffuseProbes[current.id].drawDiffuseMap(DiffuseProbePass.baseCubeMap.texture, current.components.get(COMPONENTS.PROBE).multiplier)
                }

                DiffuseProbePass.step = STEPS_LIGHT_PROBE.CALCULATE
                break
            case STEPS_LIGHT_PROBE.CALCULATE:
                DiffuseProbePass.sort(diffuseProbes, meshes)
                DiffuseProbePass.step = STEPS_LIGHT_PROBE.DONE
                break
            default:
                DiffuseProbePass.step = STEPS_LIGHT_PROBE.DONE
                break
        }
    }

    static sort(probes, meshes) {
        const MAX_PROBES = 4
        for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
            const intersecting = []
            const currentMesh = meshes[meshIndex]
            const mPosition = currentMesh.translation
            for (let probeIndex in probes) {
                const current = probes[probeIndex]
                const component = probes[probeIndex].components.get(COMPONENTS.PROBE)
                const probePosition = current.translation
                const texture = DiffuseProbePass.diffuseProbes[current.id].irradianceTexture

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
                DiffuseProbePass.probes[currentMesh.id] = []
                for (let i = 0; i < sorted.length; i++) {
                    DiffuseProbePass.probes[currentMesh.id][i] = {}
                    DiffuseProbePass.probes[currentMesh.id][i].texture = sorted[i].ref
                    DiffuseProbePass.probes[currentMesh.id][i].multiplier = sorted[i].multiplier
                }
            }
        }
    }
}


