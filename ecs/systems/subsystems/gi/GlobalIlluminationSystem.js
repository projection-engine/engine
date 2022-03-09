import System from "../../../basic/System";

import SYSTEMS from "../../../../utils/misc/SYSTEMS";
import PropagationSystem from "./PropagationSystem";
import InjectionSystem from "./InjectionSystem";

export default class GlobalIlluminationSystem extends System {
    constructor(gpu) {
        super([]);

        this.gpu = gpu
        this.samplesAmmount = 32
        this.injectionSystem = new InjectionSystem(gpu)
        this.lightPropagationSystem = new PropagationSystem(gpu)
    }

    get size() {
        return this.samplesAmmount
    }

    get accumulatedBuffer() {
        return this.lightPropagationSystem.accumulatedBuffer
    }

    execute(systems, skylight) {
        super.execute()

        const shadowMapSystem = systems[SYSTEMS.SHADOWS]
        shadowMapSystem.needsGIUpdate = false


        this._clear();
        this.injectionSystem.execute(shadowMapSystem.rsmFramebuffer, skylight.direction)

        this.lightPropagationSystem.execute(
            {
                iterations: skylight.lpvSamples,
                skylight,
                lightInjectionFBO: this.injectionSystem.injectionFramebuffer,
                geometryInjectionFBO: this.injectionSystem.geometryInjectionFramebuffer
            })
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
        this.gpu.enable(this.gpu.DEPTH_TEST);
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);
    }

    _clear() {
        this.gpu.disable(this.gpu.BLEND)
        this.gpu.viewport(0, 0, this.framebufferSize ** 2, this.framebufferSize)
        this.lightPropagationSystem.accumulatedBuffer.clear()
        this.injectionSystem.geometryInjectionFramebuffer.clear()
        this.injectionSystem.injectionFramebuffer.clear()
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
    }

    static createPointsData(positionData, gpu) {
        const pointPositions = gpu.createBuffer();
        gpu.bindBuffer(gpu.ARRAY_BUFFER, pointPositions);
        gpu.bufferData(gpu.ARRAY_BUFFER, positionData, gpu.STATIC_DRAW);

        const pointArray = gpu.createVertexArray()
        gpu.bindVertexArray(pointArray);
        gpu.bindBuffer(gpu.ARRAY_BUFFER, pointPositions);

        gpu.vertexAttribPointer(
            0,
            2,
            gpu.FLOAT,
            false,
            8,
            0
        );

        gpu.enableVertexAttribArray(0);
        gpu.bindVertexArray(null);
        gpu.bindBuffer(gpu.ARRAY_BUFFER, null);

        return {
            dataLength: positionData.length,
            pointArray,
            pointPositions
        }
    }

    static createInjectionPointCloud(size) {
        const positionData = new Float32Array(size * size * 2);

        let positionIndex = 0;
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }

        return positionData;
    }

}