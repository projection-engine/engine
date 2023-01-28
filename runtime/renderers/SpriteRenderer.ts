import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import StaticShaders from "../../lib/StaticShaders";
import StaticMeshes from "../../lib/StaticMeshes";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";

export default class SpriteRenderer{
    static execute() {
        const sprites = ResourceEntityMapper.sprites.array
        const size = sprites.length
        if (size === 0)
            return

        const context = GPU.context
        const textures = GPU.textures
        const uniforms = StaticShaders.spriteUniforms
        StaticShaders.sprite.bind()
        context.activeTexture(context.TEXTURE0)
        for (let i = 0; i < size; i++) {
            const current = sprites[i], component = current.spriteComponent
            if (!current.active || current.isCulled)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue

            context.uniformMatrix4fv(uniforms.transformationMatrix, false, current.matrix)
            context.uniform3fv(uniforms.scale, current._scaling)
            context.uniform2fv(uniforms.attributes, component.attributes)
            context.bindTexture(context.TEXTURE_2D, texture.texture)
            context.uniform1i(uniforms.iconSampler, 0)
            StaticMeshes.drawQuad()
        }

        MetricsController.currentState = METRICS_FLAGS.SPRITE
        context.enable(context.CULL_FACE)
    }
}