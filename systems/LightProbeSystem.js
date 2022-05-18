import System from "../basic/System";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import COMPONENTS from "../templates/COMPONENTS";
import CubeMapSystem from "./CubeMapSystem";
import CubeMapInstance from "../instances/CubeMapInstance";
import {WebWorker} from "../utils/WebWorker";
import {irradiance} from "../shaders/CUBE_MAP.glsl";

export const STEPS_LIGHT_PROBE = {
    GENERATION: 0,

    DONE: 3,
    CALCULATE: 4
}
export default class LightProbeSystem extends System {
    step = STEPS_LIGHT_PROBE.GENERATION
    lastCallLength = -1
    lightProbeConsumption = {}

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.baseCubeMap = new CubeMapInstance(gpu, 128, false)

    }
    execute(options, systems, data, sceneColor) {
        super.execute()
        const {
            lightProbes,
            meshes,
            skybox,
            cubeBuffer,
            skyboxShader
        } = data


        if (this.lastCallLength !== lightProbes.length) {
            this.step = STEPS_LIGHT_PROBE.GENERATION
            this.lastCallLength = lightProbes.length
        }
        switch (this.step) {

            case STEPS_LIGHT_PROBE.GENERATION:
                for (let i = 0; i < lightProbes.length; i++) {
                    const current = lightProbes[i].components[COMPONENTS.CUBE_MAP]
                    const transformation = lightProbes[i].components[COMPONENTS.TRANSFORM]

                    this.baseCubeMap.draw((yaw, pitch, projection, index) => {
                            const target = vec3.add([], transformation.position, VIEWS.target[index])
                            const view = mat4.lookAt([], transformation.position, target, VIEWS.up[index])
                            CubeMapSystem.draw({
                                view,
                                projection,
                                data,
                                options,
                                cubeMapPosition: transformation.position,
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
                    current.cubeMap.generateIrradiance(cubeBuffer, this.baseCubeMap.texture)
                }

                this.step = STEPS_LIGHT_PROBE.CALCULATE
                break
            case STEPS_LIGHT_PROBE.CALCULATE:
                this.sort(lightProbes, meshes)
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
        const MAX_PROBES = 3

        for (let meshIndex in meshes) {
            const intersecting = []
            const currentMesh = meshes[meshIndex]
            for (let probeIndex in probes) {
                const probePosition = probes[probeIndex].components[COMPONENTS.TRANSFORM].translation
                const texture = probes[probeIndex].components[COMPONENTS.CUBE_MAP].cubeMap.irradianceTexture
                const mPosition = currentMesh.components[COMPONENTS.TRANSFORM].translation
                if (intersecting.length < MAX_PROBES) {
                    intersecting.push({
                        ref: texture,
                        distance: vec3.len(vec3.subtract([], probePosition, mPosition)),
                        irradianceMultiplier: probes[probeIndex].components[COMPONENTS.CUBE_MAP].irradianceMultiplier
                    })
                } else {
                    const currentDistance = vec3.len(vec3.subtract([], probePosition, mPosition))
                    for (let intIndex in intersecting) {
                        if (currentDistance < intersecting[intIndex].distance) {
                            intersecting[intIndex] = {
                                ref: texture,
                                distance: currentDistance,
                                irradianceMultiplier: probes[probeIndex].components[COMPONENTS.CUBE_MAP].irradianceMultiplier
                            }
                            break
                        }
                    }
                }
            }
            if(intersecting.length > 0) {
                currentMesh.components[COMPONENTS.MATERIAL].irradiance = intersecting.sort((a, b) => a.distance - b.distance)
                currentMesh.components[COMPONENTS.MATERIAL].irradianceMultiplier = intersecting[0].irradianceMultiplier
            }

        }
    }
}


