import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import GridInstance from "../../../elements/instances/GridInstance";
import * as shaderCode from '../../../shaders/resources/misc/grid.glsl'
import Shader from "../../../utils/workers/Shader";

export default class GridSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.gridShader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.attribLocation = gpu.getAttribLocation(this.gridShader.program, 'position')
        this.grid = new GridInstance(gpu)
    }

    execute(gridVisibility, camera) {
        super.execute()

        if(gridVisibility) {
            this.gpu.disable(this.gpu.DEPTH_TEST)
            this.gridShader.use()

            this.gpu.enableVertexAttribArray(this.attribLocation)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.grid.vertexBuffer)
            this.gpu.vertexAttribPointer(this.attribLocation, 3, this.gpu.FLOAT, false, 0, 0)

            this.gridShader.bindForUse({
                cameraType: camera instanceof OrthographicCamera ? 1 + camera.direction : 0,
                viewMatrix: camera instanceof OrthographicCamera ? camera.viewMatrixGrid : camera.viewMatrix,
                projectionMatrix: camera.projectionMatrix
            })

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, this.grid.length)
            this.gpu.enable(this.gpu.DEPTH_TEST)
        }
    }
}