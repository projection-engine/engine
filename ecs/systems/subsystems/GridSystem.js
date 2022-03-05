import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import * as shaderCode from '../../../shaders/resources/misc/grid.glsl'
import Shader from "../../../utils/workers/Shader";
import Quad from "../../../utils/workers/Quad";

export default class GridSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.gridShader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.grid = new Quad(gpu)
    }

    execute(gridVisibility, camera) {
        super.execute()

        if(gridVisibility) {
            this.gpu.disable(this.gpu.DEPTH_TEST)
            this.gridShader.use()


            this.gridShader.bindForUse({
                cameraType: camera instanceof OrthographicCamera ? 1 + camera.direction : 0,
                viewMatrix: camera instanceof OrthographicCamera ? camera.viewMatrixGrid : camera.viewMatrix,
                projectionMatrix: camera.projectionMatrix
            })

            this.grid.draw()
            this.gpu.enable(this.gpu.DEPTH_TEST)
        }
    }
}