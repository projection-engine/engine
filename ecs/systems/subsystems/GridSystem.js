import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import GridShader from "../../../shaders/classes/GridShader";
import GridInstance from "../../../elements/instances/GridInstance";

export default class GridSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.gridShader = new GridShader(gpu)
        this.grid = new GridInstance(gpu)
    }

    execute(gridVisibility, camera) {
        super.execute()

        if(gridVisibility) {
            this.gpu.disable(this.gpu.DEPTH_TEST)
            this.gridShader.use()

            this.gpu.enableVertexAttribArray(this.gridShader.positionLocation)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.grid.vertexBuffer)
            this.gpu.vertexAttribPointer(this.gridShader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)

            this.gpu.uniform1i(this.gridShader.typeULocation, camera instanceof OrthographicCamera ? 1 + camera.direction : 0)
            this.gpu.uniformMatrix4fv(this.gridShader.viewMatrixULocation, false, camera instanceof OrthographicCamera ? camera.viewMatrixGrid : camera.viewMatrix)
            this.gpu.uniformMatrix4fv(this.gridShader.projectionMatrixULocation, false, camera.projectionMatrix)

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, this.grid.length)
            this.gpu.enable(this.gpu.DEPTH_TEST)
        }
    }
}