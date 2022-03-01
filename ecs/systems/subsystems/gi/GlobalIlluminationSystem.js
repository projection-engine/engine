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

export default class GlobalIlluminationSystem extends System {

    constructor(gpu) {
        super([]);

        this.shader = new RSMShader(gpu)
        this.gpu = gpu
        this.samplesAmmount = 32

        this.lightInjectionSystem = new LightInjectionSystem(gpu, 2048, this.samplesAmmount)
        this.geometryInjectionSystem = new GeometryInjectionSystem(gpu, 2048, this.samplesAmmount)
        this.lightPropagationSystem = new LightPropagationSystem(gpu, 2048, this.samplesAmmount)
    }

    get size (){
        return this.samplesAmmount
    }

    get accumulatedBuffer() {
        return this.lightPropagationSystem.alFBO
    }

    execute(systems, directionalLights) {
        super.execute()

        const shadowMapSystem = systems[SYSTEMS.SHADOWS]

        if (directionalLights.length > 0 && shadowMapSystem.needsGIUpdate) {
            const light = directionalLights[0].components.DirectionalLightComponent
            shadowMapSystem.needsGIUpdate = false

            this.gpu.disable(this.gpu.BLEND)
            // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.lightInjectionSystem.framebuffer.frameBufferObject)
            // this.gpu.viewport(0, 0, this.samplesAmmount ** 2, this,this.samplesAmmount)
            // this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            //
            // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.lightPropagationSystem.alFBO.frameBufferObject)
            // this.gpu.viewport(0, 0, this.samplesAmmount ** 2, this,this.samplesAmmount)
            // this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            //
            // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER,null)

            this.lightInjectionSystem.execute(shadowMapSystem.shadowMapAtlas);
            this.geometryInjectionSystem.execute(shadowMapSystem.shadowMapAtlas, light, this.lightInjectionSystem.injectionFinished);
            this.lightPropagationSystem.execute(
                shadowMapSystem.shadowMapAtlas,
                light,
                this.samplesAmmount,
                this.lightInjectionSystem.injectionFinished,
                this.geometryInjectionSystem.geometryInjectionFinished,
                this.lightInjectionSystem.framebuffer,
                this.geometryInjectionSystem.framebuffer
            )

            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null);
            this.gpu.enable(this.gpu.DEPTH_TEST);
            this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);

            //
            //
            //
            // this.gpu.disable(this.gpu.DEPTH_TEST);
            // this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);
            //
            //
            // this.shader.use()
            // this.shader.bindUniforms(
            //     this.quantityIndirect,
            //     this.sRadius,
            //     this.samplesAmmount,
            //     this.samplesTextureSize,
            //     meshSystem.gBuffer.gNormalTexture,
            //     meshSystem.gBuffer.gPositionTexture,
            //     shadowMapSystem.shadowMapAtlas.rsmNormalTexture,
            //     shadowMapSystem.shadowMapAtlas.rsmWorldPositionTexture,
            //     shadowMapSystem.shadowMapAtlas.rsmFluxTexture,
            //     this.samplesTexture.texture,
            //     light.lightProjection,
            //     light.lightView
            // )
            // this.quad.draw(this.shader.positionLocation)
            //
            // this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);
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
        const pointPositions = new VBO(gpu, 0, new Float32Array(positionData), gpu.ARRAY_BUFFER, 2, gpu.FLOAT)

        return {pointArray, pointPositions, size: positionData.length};
    }
}