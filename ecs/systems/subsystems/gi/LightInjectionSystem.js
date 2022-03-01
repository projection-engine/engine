import System from "../../../basic/System";
import LightInjectionShader from "../../../../shaders/classes/gi/LightInjectionShader";
import GIFramebuffer from "../../../../elements/buffer/gi/GIFramebuffer";
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";

export default class LightInjectionSystem extends System {

    constructor(gpu, s, gridSize) {
        super([]);
        this.gpu = gpu

        this._size = s
        this._gridSize = gridSize

        this.shader = new LightInjectionShader(gpu)
        this.framebuffer = new GIFramebuffer(gridSize, gpu)

        const {pointArray, pointPositions, size} = GlobalIlluminationSystem.generatePointCloud(gpu, s)
        this.pointsLength = size
        this.pointArray = pointArray
        this.pointPositions = pointPositions
    }


    execute(rsmFBO) {
        super.execute()
        this.injectionFinished = false;

        const rsmFlux = rsmFBO.rsmFluxTexture
        const rsmPositions = rsmFBO.rsmWorldPositionTexture
        const rsmNormals = rsmFBO.rsmNormalTexture


        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.framebuffer.frameBufferObject)

        this.gpu.viewport(0,0, this._gridSize ** 2, this.pointArray)
        this.gpu.disable(this.gpu.DEPTH_TEST);
        this.gpu.enable(this.gpu.BLEND);
        this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);

        this.gpu.bindVertexArray(this.pointArray)
        this.pointPositions.enable()

        this.shader.bindUniforms(
            rsmFlux,
            rsmPositions,
            rsmNormals,
            this._size,
            this._gridSize
        )


        this.gpu.drawArrays(this.gpu.POINTS,  0,this.pointsLength/2)
        this.gpu.bindVertexArray(null)
        this.pointPositions.disable()

        this.injectionFinished = true;
    }

}
