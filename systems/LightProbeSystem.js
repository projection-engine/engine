import System from "../basic/System";
import {mat4, vec3} from "gl-matrix";
import {VIEWS} from "./ShadowMapSystem";
import COMPONENTS from "../templates/COMPONENTS";
import CubeMapSystem from "./CubeMapSystem";
import CubeMapInstance from "../instances/CubeMapInstance";
import {WebWorker} from "../utils/WebWorker";

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
        this.worker = new WebWorker()

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
                this.worker.createExecution({probes: lightProbes, meshes, COMPONENTS}, sort.toString())
                    .then(res => this.lightProbeConsumption = res)

                this.step = STEPS_LIGHT_PROBE.DONE
                break
            default:
                this.step = STEPS_LIGHT_PROBE.DONE
                break
        }
    }


}

async function sort() {
    self.addEventListener('message', (event) => {
        const len = (a)  => {
            let x = a[0];
            let y = a[1];
            let z = a[2];
            return Math.hypot(x, y, z);
        }
         const subtract = (a, b) => {
            const out = []
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];
            return out;
        }

        const {
            probes,
            meshes,
            COMPONENTS
        } = event.data
        const MAX_PROBES = 3
        const sorted = {}
        const l = probes.length
        const lm = meshes.length
        for (let meshIndex = 0; meshIndex < lm; meshIndex++) {
            const intersecting = []
            const cm = meshes[meshIndex]
            for (let probeIndex = 0; probeIndex < l; probeIndex++) {
                const current = probes[probeIndex].components
                const probePosition = current[COMPONENTS.TRANSFORM].translation
                const mPosition = cm.components[COMPONENTS.TRANSFORM].translation
                if (intersecting.length > MAX_PROBES) {
                    intersecting.push({
                        id: probes[probeIndex].id,
                        distance: len(subtract(probePosition, mPosition))
                    })
                } else {
                    const currentDistance = len(subtract(probePosition, mPosition))
                    for (let intIndex in intersecting) {
                        if (currentDistance < intersecting[intIndex].distance) {
                            intersecting[intIndex] = {
                                id: probes[probeIndex].id,
                                distance: currentDistance
                            }
                            break
                        }
                    }
                }
            }
            sorted[cm.id] = intersecting
        }
        self.postMessage(sorted)
    })
}