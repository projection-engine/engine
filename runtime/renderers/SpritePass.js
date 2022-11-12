import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import COMPONENTS from "../../static/COMPONENTS.js";

let shader, uniforms
export default class SpritePass {
    static shader
    static initialize() {
        shader = SpritePass.shader
        uniforms = shader.uniformMap
    }

    static execute() {
        const sprites = Engine.data.sprites
        const s = sprites.length
        if (s === 0)
            return
        const textures = GPU.textures


        gpu.disable(gpu.CULL_FACE)
        shader.bind()
        gpu.activeTexture(gpu.TEXTURE0)

        for (let i = 0; i < s; i++) {
            const current = sprites[i], component = current.components.get(COMPONENTS.SPRITE)
            if (!current.active)
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