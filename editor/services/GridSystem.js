import * as shaderCode from "../templates/GRID.glsl"
import ShaderInstance from "../../production/libs/instances/ShaderInstance"
import QuadInstance from "../../production/libs/instances/QuadInstance"
import RendererController from "../../production/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";

export default class GridSystem {
    constructor() {
        this.gridShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.grid = new QuadInstance()
    }

    execute() {

        if (RendererController.params.gridVisibility && !CameraAPI.isOrthographic) {
            this.gridShader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                gamma: CameraAPI.metadata.gamma,
                exposure: CameraAPI.metadata.exposure
            })

            this.grid.draw()
        }
    }
}