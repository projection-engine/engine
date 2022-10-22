import {mat4, vec3} from "gl-matrix"
import {VIEWS} from "./ShadowMapPass"
import COMPONENTS from "../../../static/COMPONENTS.js"
import CubeMap from "../../instances/CubeMap"
import MaterialAPI from "../../apis/rendering/MaterialAPI";
import Engine from "../../../Engine";
import GPUResources from "../../../GPUResources";

export const STEPS_CUBE_MAP = {
    BASE: 0,
    PRE_FILTERED: 1,

    DONE: 2,
    CALCULATE: 3
}
const PREFIX  = "SPECULAR-"
export default class SpecularProbePass {
    static compile(){
        SpecularProbePass.step = STEPS_CUBE_MAP.BASE
    }
    static step = STEPS_CUBE_MAP.BASE
    static lastCallLength = -1
    static probes = {}
    static specularProbes = {}

    static execute() {
        const {
            specularProbes,
            meshes
        } = Engine.data

        if (SpecularProbePass.lastCallLength !== specularProbes.length) {
            SpecularProbePass.step = STEPS_CUBE_MAP.BASE
            SpecularProbePass.lastCallLength = specularProbes.length
        }
        switch (SpecularProbePass.step) {
            case STEPS_CUBE_MAP.BASE:
                for (let i = 0; i < specularProbes.length; i++) {
                    const current = specularProbes[i]
                    if (!current.active)
                        continue
                    const component = current.components.get(COMPONENTS.PROBE)
                    if (!SpecularProbePass.specularProbes[current.id])
                        SpecularProbePass.specularProbes[current.id] = new CubeMap(component.resolution, false)
                    else
                        SpecularProbePass.specularProbes[current.id].resolution = component.resolution
                    const cubeMap = SpecularProbePass.specularProbes[current.id]
                    cubeMap.draw((yaw, pitch, projection, index) => {
                            const target = vec3.add([], current._translation, VIEWS.target[index])
                            const view = mat4.lookAt([], current._translation, target, VIEWS.up[index])
                            MaterialAPI.drawProbe(
                                view,
                                projection,
                                current._translation
                            )
                        },
                        10000,
                        1
                    )

                    cubeMap.generatePrefiltered(component.mipmaps, component.resolution)
                }
                SpecularProbePass.step = STEPS_CUBE_MAP.PRE_FILTERED
                break
            case STEPS_CUBE_MAP.PRE_FILTERED:
                for (let i = 0; i < SpecularProbePass.lastCallLength; i++) {
                    if (!specularProbes[i].active)
                        continue
                    const current = specularProbes[i].components.get(COMPONENTS.PROBE)
                    SpecularProbePass.specularProbes[specularProbes[i].id].generatePrefiltered(current.mipmaps, current.resolution, GPUResources.cubeBuffer, current.multiplier)
                }
                SpecularProbePass.step = STEPS_CUBE_MAP.CALCULATE
                break
            case STEPS_CUBE_MAP.CALCULATE:
                SpecularProbePass.sort(meshes, specularProbes)
                SpecularProbePass.step = STEPS_CUBE_MAP.DONE
                break
            default:
                SpecularProbePass.step = STEPS_CUBE_MAP.DONE
                break
        }
    }

    static sort(entities, specularProbes) {
        for (let meshIndex = 0; meshIndex < entities.length; meshIndex++) {
            let intersecting
            const entity = entities[meshIndex]
            if (!entity.components.get(COMPONENTS.MESH).contributeToProbes)
                continue
            for (let index = 0; index < specularProbes.length; index++) {
                const probePosition = specularProbes[index].translation
                const mPosition = entity.translation
                const distance = vec3.len(vec3.subtract([], probePosition, mPosition))
                const component = specularProbes[index].components.get(COMPONENTS.PROBE)
                if (!intersecting || distance < intersecting.distance)
                    intersecting = {
                        mipmaps: component.mipmaps - 1,
                        texture: SpecularProbePass.specularProbes[specularProbes[index].id].prefiltered,
                        distance,
                        multiplier: component.multiplier
                    }
            }

            if (intersecting) {
                SpecularProbePass.probes[entity.id] = {}
                SpecularProbePass.probes[entity.id].texture = intersecting.texture
                SpecularProbePass.probes[entity.id].mipmaps = intersecting.mipmaps
            }
        }
    }
}