import System from "../basic/System";
import AOBuffer from "../../renderer/elements/AOBuffer";
import AOBlurBuffer from "../../renderer/elements/AOBlurBuffer";
import AOShader from "../../renderer/shaders/classes/AOShader";
import MeshSystem from "./MeshSystem";
import {bindTexture} from "../../utils/utils";
import Texture from "../../renderer/elements/Texture";

export default class AOSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.aoBuffer = new AOBuffer()
        this.aoBlurBuffer = new AOBlurBuffer()

        this.baseShader = new AOShader(gpu)
        this.blurShader = new AOShader(gpu, true)

        this.samplePoints = generateSamplePoints()

        this.noiseTexture = new Texture(
            generateNoiseTexture(),
            false,
            this.gpu,
            this.gpu.RGBA32F,
            this.gpu.RGBA,
            true,
            true,
            this.gpu.FLOAT,
            )
    }

    execute(options, systems, data) {
        super.execute()
        const  {
            camera
        } = data
        const meshSystem = systems.find(s => s instanceof MeshSystem)
        if(meshSystem){
            const aoFBO = this.aoBuffer.frameBufferObject
            const aoBlurFBO = this.aoBlurBuffer.frameBufferObject

            aoFBO.startMapping()
                this.baseShader.use()
                this.gpu.uniformMatrix4fv(this.baseShader.projectionULocation, false, camera.projectionMatrix)
                bindTexture(0, meshSystem.gBuffer.gPositionTexture, this.baseShader.gPositionULocation, this.gpu)
                bindTexture(1, meshSystem.gBuffer.gNormalTexture, this.baseShader.gNormalULocation, this.gpu)
                bindTexture(2, this.noiseTexture.texture, this.baseShader.noiseULocation, this.gpu)
                aoFBO.draw(this.baseShader, true)
            aoFBO.stopMapping()

            aoBlurFBO.startMapping()
                this.blurShader.use()
                bindTexture(0, aoFBO.frameBufferTexture, this.blurShader.aoULocation, this.gpu)
                aoBlurFBO.draw(this.blurShader, true)
            aoBlurFBO.stopMapping()

        }
    }
}

function generateNoiseTexture(){

}
function generateSamplePoints(){
    let samplePoints = []
    for(let i =0; i< 64; i++){
        Math.floor(Math.random() * (2))
    }
    return samplePoints

}