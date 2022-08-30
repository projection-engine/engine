import ShaderInstance from "../../production/controllers/instances/ShaderInstance"
import * as shaderCode from "../templates/SELECTED.glsl"
import COMPONENTS from "../../production/data/COMPONENTS"
import FramebufferInstance from "../../production/controllers/instances/FramebufferInstance"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import GPU from "../../production/controllers/GPU";


export default class SelectedSystem {

    constructor( ) {
        this.shaderSilhouette = new ShaderInstance(
            shaderCode.vertexSilhouette,
            shaderCode.fragmentSilhouette
        )
        this.shader = new ShaderInstance(
            shaderCode.vertex,
            shaderCode.fragment
        )
        const TEXTURE = {
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT
        }
        this.frameBuffer = new FramebufferInstance().texture(TEXTURE)
    }

    drawToBuffer(selected) {
        const length = selected.length
        if (length === 0)
            return


        gpu.disable(gpu.DEPTH_TEST)
        this.frameBuffer.startMapping()
        for (let m = 0; m < length; m++) {
            const current = RendererController.entitiesMap.get(selected[m])
            if (!current || !current.active)
                continue
            const mesh = GPU.meshes.get(current.components[COMPONENTS.MESH]?.meshID)
            if (!mesh)
                continue
            this.shader.bindForUse({
                projectionMatrix: CameraAPI.projectionMatrix,
                transformMatrix: current.transformationMatrix,
                viewMatrix: CameraAPI.viewMatrix
            })
            mesh.draw()
        }
        this.frameBuffer.stopMapping()
        gpu.enable(gpu.DEPTH_TEST)

    }

    drawSilhouette(selected) {
        const length = selected.length
        if (length > 0) {
            this.shaderSilhouette.bindForUse({
                silhouette: this.frameBuffer.colors[0]
            })
            GPU.quad.draw()
            gpu.bindVertexArray(null)
        }
    }
}