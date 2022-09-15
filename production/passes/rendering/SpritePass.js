import Engine from "../../Engine";
import CameraAPI from "../../apis/camera/CameraAPI";
import GPU from "../../GPU";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import COMPONENTS from "../../../static/COMPONENTS.json";
import QuadAPI from "../../apis/rendering/QuadAPI";

export default class SpritePass {
    static shader
    static shaderInstanced

    static initialize() {
        SpritePass.shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE)
        SpritePass.shaderInstanced = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE_INSTANCED)
    }

    static execute() {
        const textures = GPU.textures
        const sprites = Engine.data.sprites
        const shaderAttr = {
            cameraPosition: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }

        QuadAPI.use()
        for (let i = 0; i < sprites.length; i++) {

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
            QuadAPI.drawQuad()
        }
        QuadAPI.finish()
    }
}