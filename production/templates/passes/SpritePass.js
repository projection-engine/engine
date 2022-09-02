import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/CameraAPI";
import GPU from "../../controllers/GPU";
import STATIC_SHADERS from "../../../static/STATIC_SHADERS";
import COMPONENTS from "../../data/COMPONENTS";

export default class SpritePass {
    static shader
    static shaderInstanced

    static initialize() {
        SpritePass.shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE)
        SpritePass.shaderInstanced = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE_INSTANCED)
    }

    static execute() {
        const textures = GPU.textures
        const sprites = RendererController.data.sprites
        const shaderAttr = {
            cameraPosition: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }

        GPU.quad.use()
        for (let i = 0; i < sprites.length; i++) {
            const current = sprites[i], component = current.components[COMPONENTS.SPRITE]
            const texture = textures.get(component.imageID)
            if (!texture)
                continue
            shaderAttr.scale = current.scaling
            shaderAttr.transformationMatrix = current.transformationMatrix
            shaderAttr.iconSampler = texture.texture
            shaderAttr.attributes = component.attributes

            SpritePass.shader.bindForUse(shaderAttr)
            GPU.quad.draw()
        }
        GPU.quad.finish()
    }
}