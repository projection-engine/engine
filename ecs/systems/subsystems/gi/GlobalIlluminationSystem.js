import System from "../../../basic/System";
import RSMShader from "../../../../shaders/classes/gi/RSMShader";
import seed from "seed-random";
import TextureInstance from "../../../../elements/instances/TextureInstance";
import ImageProcessor from "../../../../../workers/ImageProcessor";
import Quad from "../../../../utils/workers/Quad";
import SYSTEMS from "../../../../utils/misc/SYSTEMS";
import {createVAO, createVBO} from "../../../../utils/misc/utils";
import VBO from "../../../../utils/workers/VBO";
import LightInjectionSystem from "./LightInjectionSystem";
import GeometryInjectionSystem from "./GeometryInjectionSystem";
import LightPropagationSystem from "./LightPropagationSystem";
import {func} from "prop-types";
import LightPropagationVolumes from "./LPV";

export default class GlobalIlluminationSystem extends System {
    constructor(gpu) {
        super([]);

        this.shader = new RSMShader(gpu)
        this.gpu = gpu
        this.samplesAmmount = 32

        this.lightInjectionSystem = new LightInjectionSystem(gpu, 2048, this.samplesAmmount)
        this.geometryInjectionSystem = new GeometryInjectionSystem(gpu, 2048, this.samplesAmmount)
        this.lightPropagationSystem = new LightPropagationSystem(gpu, 2048, this.samplesAmmount)


        this.lvp = new LightPropagationVolumes(gpu)
    }

    get size() {
        return this.samplesAmmount
    }

    get accumulatedBuffer() {
        return this.lvp.accumulatedBuffer
    }

    execute(systems, directionalLights) {
        super.execute()

        const shadowMapSystem = systems[SYSTEMS.SHADOWS]

        if (directionalLights.length > 0) {
            const light = directionalLights[0].components.DirectionalLightComponent

            this.lvp.clearInjectionBuffer();
            this.lvp.clearAccumulatedBuffer();

            this.lvp.lightInjection(shadowMapSystem.shadowMapAtlas);
            this.lvp.geometryInjection(shadowMapSystem.shadowMapAtlas, light.direction);
            this.lvp.lightPropagation(64);


            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
            this.gpu.enable(this.gpu.DEPTH_TEST);
            this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);

            shadowMapSystem.needsGIUpdate = false
        }
    }

    static generatePointCloud(gpu, size) {
        const positionData = new Float32Array(size * size * 2);

        let positionIndex = 0;
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }

        const pointArray = createVAO(gpu)
        const pointPositions = new VBO(gpu, 0, new Float32Array(positionData), gpu.ARRAY_BUFFER, 2, gpu.FLOAT, false, gpu.STATIC_DRAW, 8)


        return {pointArray, pointPositions, size: positionData.length};
    }
}