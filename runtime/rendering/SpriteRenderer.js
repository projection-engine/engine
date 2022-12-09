import Engine from "../../Engine";
import GPU from "../../GPU";
import COMPONENTS from "../../static/COMPONENTS.js";
import DynamicMap from "../../DynamicMap";
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
        gpu.disable(gpu.CULL_FACE)
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        for (let i = 0; i < size; i++) {
            const current = sprites[i], component = current.components.get(COMPONENTS.SPRITE)
            if (!current._active)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue

            gpu.uniformMatrix4fv(uniforms.transformationMatrix, false, current.matrix)
            gpu.uniform3fv(uniforms.scale, current._scaling)
            gpu.uniform2fv(uniforms.attributes, component.attributes)
            gpu.bindTexture(gpu.TEXTURE_2D, texture.texture)
            gpu.uniform1i(uniforms.iconSampler, 0)
            drawQuad()
        }

        gpu.enable(gpu.CULL_FACE)
    }
}