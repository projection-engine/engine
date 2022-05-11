import System from "../basic/System";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import COMPONENTS from "../templates/COMPONENTS";
import CubeMapSystem from "./CubeMapSystem";
import CubeMapInstance from "../instances/CubeMapInstance";

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

    execute(options, systems, data) {
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
                    this.baseCubeMap.draw((yaw, pitch, projection, index) => {
                            const target = vec3.add([], lightProbes[i].components[COMPONENTS.TRANSFORM].position, VIEWS.target[index])
                            const view = mat4.lookAt([], lightProbes[i].components[COMPONENTS.TRANSFORM].position, target, VIEWS.up[index])
                            CubeMapSystem.draw({
                                view,
                                projection,
                                data,
                                options,
                                cubeMapPosition: lightProbes[i].components[COMPONENTS.TRANSFORM].translation,
                                skybox,
                                cubeBuffer,
                                skyboxShader
                            })
                        }, undefined,
                        10000,
                        1
                    )
                    current.cubeMap.generateIrradiance(cubeBuffer, this.baseCubeMap.texture)
                }
                this.step = STEPS_LIGHT_PROBE.CALCULATE
                break
            case STEPS_LIGHT_PROBE.CALCULATE:
                this.lightProbeConsumption = CubeMapSystem.sort(meshes, lightProbes)
                this.step = STEPS_LIGHT_PROBE.DONE
                break
            default:
                this.step = STEPS_LIGHT_PROBE.DONE
                break
        }
    }

}