import GPU from "../../GPU";
import COMPONENTS from "../../static/COMPONENTS.js";
import DynamicMap from "../../lib/DynamicMap";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";

let shader, uniforms
export default class SpriteRenderer {
    static sprites = new DynamicMap()

    static initialize() {
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SPRITE)
        uniforms = shader.uniformMap
    }

    static execute() {
        const sprites = SpriteRenderer.sprites.array
        const size = sprites.length
        if (size === 0)
            return

        const textures = GPU.textures
        GPU.context.disable(GPU.context.CULL_FACE)
        shader.bind()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        for (let i = 0; i < size; i++) {
            const current = sprites[i], component = current.components.get(COMPONENTS.SPRITE)
            if (!current.active || current.isCulled)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue

            GPU.context.uniformMatrix4fv(uniforms.transformationMatrix, false, current.matrix)
            GPU.context.uniform3fv(uniforms.scale, current._scaling)
            GPU.context.uniform2fv(uniforms.attributes, component.attributes)
            GPU.context.bindTexture(GPU.context.TEXTURE_2D, texture.texture)
            GPU.context.uniform1i(uniforms.iconSampler, 0)
            GPU.drawQuad()
        }

        GPU.context.enable(GPU.context.CULL_FACE)
    }
}