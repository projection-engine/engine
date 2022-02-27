import System from "../../basic/System";
import MeshShader from "../../../shaders/classes/MeshShader";
import {SHADING_MODELS} from "../../../../../pages/project/hook/useSettings";
import DeferredShader from "../../../shaders/classes/DeferredShader";
import FlatDeferredShader from "../../../shaders/classes/FlatDeferredShader";
import ShadowMapSystem from "../ShadowMapSystem";
import brdfImg from "../../../../../static/brdf_lut.jpg";
import {createTexture} from "../../../utils/misc/utils";
import MeshSystem from "../MeshSystem";
import AOSystem from "../AOSystem";
import GIShader from "../../../shaders/classes/GIShader";
import seed from "seed-random";
import TextureInstance from "../../../elements/instances/TextureInstance";
import ImageProcessor from "../../../../workers/ImageProcessor";
import Quad from "../../../utils/workers/Quad";

export default class GlobalIlluminationSystem extends System {

ready = false
    constructor(gpu) {
        super([]);

        this.shader = new GIShader(gpu)
        this.gpu = gpu
        this.quad = new Quad(gpu)

        this.quantityIndirect =3
        this.sRadius = 300
        this.samplesAmmount = 64
        this.samples = []
        const seedE =seed('123123as')
        for (let i = 0; i <  this.samplesAmmount; i++) {
            let xi1 = seedE()
            let xi2 = seedE()

            let x = xi1 * Math.sin(2 * Math.PI * xi2)
            let y = xi1 * Math.cos(2 * Math.PI * xi2)
            this.samples.push([x, y, xi1])
        }
        this.samplesTextureSize = 1
        while (this.samplesTextureSize < this.samplesAmmount) {
            this.samplesTextureSize *= 2
        }
        let textureData = []
        for (let i = 0; i < this.samplesTextureSize; i++) {
            let p
            if (i < this.samplesAmmount) {
                p = this.samples[i]
            } else
                p = [0.0, 0.0, 0.0]

            textureData.push(p[0])
            textureData.push(p[1])
            textureData.push(p[2])
            textureData.push(0.0)
        }

        const img = new Image()
        img.onload = () => {
            this.samplesTexture = new TextureInstance(
                img,
                false,
                gpu,
                 gpu.RGBA16F,
                gpu.RGBA,
                false,
                false,
                gpu.FLOAT,
                )
            this.ready = true
        }
        img.src = ImageProcessor.dataToImage(textureData, this.samplesTextureSize, 1, true)

    }


    execute(systems, directionalLights) {
        super.execute()
        if(directionalLights.length > 0 && this.ready) {
            const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)
            const meshSystem = systems.find(s => s instanceof MeshSystem)


            // MULTI LIGHT

            const light = directionalLights[0].components.DirectionalLightComponent
            this.shader.use()
            this.shader.bindUniforms(
                this.quantityIndirect,
                this.sRadius,
                this.samplesAmmount,
                this.samplesTextureSize,
                meshSystem.gBuffer.gNormalTexture,
                meshSystem.gBuffer.gPositionTexture,
                shadowMapSystem.shadowMapAtlas.rsmNormalTexture,
                shadowMapSystem.shadowMapAtlas.rsmWorldPositionTexture,
                shadowMapSystem.shadowMapAtlas.rsmFluxTexture,
                this.samplesTexture.texture,
                light.lightProjection,
                light.lightView
            )

            this.quad.draw(this.shader.positionLocation)
        }
    }

}