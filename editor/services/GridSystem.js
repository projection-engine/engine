import * as shaderCode from "../templates/GRID.glsl"
import ShaderInstance from "../../production/controllers/instances/ShaderInstance"
import QuadInstance from "../../production/controllers/instances/QuadInstance"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import GPU from "../../production/controllers/GPU";

export default class GridSystem {
    constructor() {
        this.gridShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)

    }

    execute() {

        if (RendererController.params.gridVisibility && !CameraAPI.isOrthographic) {
            this.gridShader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                gamma: CameraAPI.metadata.gamma,
                exposure: CameraAPI.metadata.exposure
            })

            GPU.quad.draw()
        }
    }
}