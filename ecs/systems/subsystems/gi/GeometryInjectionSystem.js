import System from "../../../basic/System";
import GeometryInjectionShader from "../../../../shaders/classes/gi/GeometryInjectionShader";
import GIFramebuffer from "../../../../elements/buffer/gi/GIFramebuffer";
import GlobalIlluminationSystem from "./GlobalIlluminationSystem";

export default class GeometryInjectionSystem extends System {

    constructor(gpu, s, gridSize) {
        super([]);
        this.gpu = gpu

        this._size = s
        this._gridSize = gridSize
        this.shader = new GeometryInjectionShader(gpu)
        this.framebuffer = new GIFramebuffer(gridSize, gpu)

        const {pointArray, pointPositions, size} = GlobalIlluminationSystem.generatePointCloud(gpu, s)
        this.pointsLength = size
        this.pointArray = pointArray
        this.pointPositions = pointPositions
    }


    execute(rsmFBO, skylight, injectionFinished) {
        super.execute()
        this.geometryInjectionFinished = false;


        const rsmFlux = rsmFBO.rsmFluxTexture
        const rsmPositions = rsmFBO.rsmWorldPositionTexture
        const rsmNormals = rsmFBO.rsmNormalTexture

        const lightDirection = skylight.direction;

        if (injectionFinished) {

            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.framebuffer.frameBufferObject)
            this.gpu.viewport(0,0, this._gridSize ** 2, this._gridSize)
            this.gpu.enable(this.gpu.DEPTH_TEST);
            this.gpu.depthFunc(this.gpu.LEQUAL);
            this.gpu.disable(this.gpu.BLEND);
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)

            this.shader.use()
            this.gpu.bindVertexArray(this.pointArray)
            this.pointPositions.enable()
            this.shader.bindUniforms(
                lightDirection, rsmFlux, rsmPositions, rsmNormals, this._size, this._gridSize
            )
            this.gpu.drawArrays(this.gpu.POINTS, 0, this.pointsLength/2)
            // this.gpu.bindVertexArray(null)

            // this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
            // this.pointPositions.disable()
            this.geometryInjectionFinished = true;

        }

    }

}
