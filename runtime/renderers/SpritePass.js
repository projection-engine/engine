import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import COMPONENTS from "../../static/COMPONENTS.js";

export default class SpritePass {
    static shader
    static initialize() {
        SpritePass.shader = GPUResources.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE)
    }

    static execute() {
        const sprites = Engine.data.sprites
        const s = sprites.length
        if (s === 0)
            return
        const textures = GPUResources.textures

        const shaderAttr = {
            cameraPosition: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }

        gpu.disable(gpu.CULL_FACE)
        for (let i = 0; i < s; i++) {

            const current = sprites[i], component = current.components.get(COMPONENTS.SPRITE)
            if (!current.active)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue
            shaderAttr.scale = current.scaling
            shaderAttr.transformationMatrix = current.matrix
            shaderAttr.iconSampler = texture.texture
            shaderAttr.attributes = component.attributes

            SpritePass.shader.bindForUse(shaderAttr)
            GPUResources.quad.draw()
        }

        gpu.enable(gpu.CULL_FACE)
    }
}