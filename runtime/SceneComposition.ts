import Engine from "../Engine";
import GPU from "../GPU";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityRenderer from "./VisibilityRenderer";
import Shader from "../instances/Shader";
import CameraAPI from "../lib/utils/CameraAPI";
import SHADING_MODELS from "../static/SHADING_MODELS";
import StaticFBO from "../lib/StaticFBO";
import UberShader from "../utils/UberShader";
import EntityComponentMapping from "../lib/EntityComponentMapping";
import SceneRenderer from "./SceneRenderer";
import Entity from "../instances/Entity";





export default class SceneComposition {
    static debugShadingModel = SHADING_MODELS.DETAIL

    static execute(useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        if (!UberShader.uber)
            return

        UberShader.uber.bind()
        const uniforms = UberShader.uberUniforms
        const meshes = EntityComponentMapping.meshesToDraw.array
        const sprites = EntityComponentMapping.sprites.array

        const context = GPU.context

        SceneRenderer.bindGlobalResources(context, uniforms, useCustomView, viewProjection, viewMatrix, cameraPosition)

        StaticFBO.postProcessing2.startMapping()

        SceneRenderer.drawMeshes(false, context, meshes, uniforms, useCustomView)
        SceneRenderer.drawMeshes(true, context, sprites, uniforms, useCustomView)

        StaticFBO.postProcessing2.stopMapping()
    }

}