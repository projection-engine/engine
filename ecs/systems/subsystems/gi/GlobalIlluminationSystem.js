import System from "../../../basic/System";
import RSMSamplerShader from "../../../../shaders/classes/gi/RSMSamplerShader";
import SYSTEMS from "../../../../utils/misc/SYSTEMS";
import LightPropagationVolumes from "./LPV";

export default class GlobalIlluminationSystem extends System {
    constructor(gpu) {
        super([]);

        this.shader = new RSMSamplerShader(gpu)
        this.gpu = gpu
        this.samplesAmmount = 32

        // this.lightInjectionSystem = new LightInjectionSystem(gpu, 2048, this.samplesAmmount)
        // this.geometryInjectionSystem = new GeometryInjectionSystem(gpu, 2048, this.samplesAmmount)
        // this.lightPropagationSystem = new LightPropagationSystem(gpu, 2048, this.samplesAmmount)


        this.lvp = new LightPropagationVolumes(gpu)
    }

    get size() {
        return this.samplesAmmount
    }

    get accumulatedBuffer() {
        return this.lvp.accumulatedBuffer
    }

    execute(systems, skylight) {
        super.execute()

        const shadowMapSystem = systems[SYSTEMS.SHADOWS]
        shadowMapSystem.needsGIUpdate = false


        this.lvp.clear();
        this.lvp.lightInjection(shadowMapSystem.rsmFramebuffer);
        this.lvp.geometryInjection(shadowMapSystem.rsmFramebuffer, skylight.direction);


        this.lvp.lightPropagation(skylight.lvpSamples);

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);

        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);
        this.gpu.enable(this.gpu.DEPTH_TEST);
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);

    }
}