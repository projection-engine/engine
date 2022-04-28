import System from "../../ecs/basic/System";
import OrthographicCamera from "../camera/ortho/OrthographicCamera";
import * as shaderCode from '../../shaders/misc/grid.glsl'
import Shader from "../../utils/Shader";
import Quad from "../../utils/Quad";

export default class GridSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.gridShader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.grid = new Quad(gpu)
    }

    execute(options) {
        super.execute()
        const {
            gridVisibility,
            camera,
            gamma,
            exposure
        } = options
        if(gridVisibility) {

            this.gridShader.use()


            this.gridShader.bindForUse({
                cameraType: camera instanceof OrthographicCamera ? 1 + camera.direction : 0,
                viewMatrix: camera instanceof OrthographicCamera ? camera.viewMatrixGrid : camera.viewMatrix,
                projectionMatrix: camera.projectionMatrix,
                gamma,
                exposure
            })

            this.grid.draw()

        }
    }
}