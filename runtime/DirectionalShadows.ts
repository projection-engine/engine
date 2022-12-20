import COMPONENTS from "../static/COMPONENTS"
import LightsAPI from "../lib/utils/LightsAPI";
import VisibilityRenderer from "./VisibilityRenderer";
import GPU from "../GPU";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";


let lightsToUpdate
export default class DirectionalShadows {
    static changed = false
    static resolutionPerTexture = 1024
    static maxResolution = 4096
    static lightsToUpdate = []
    static atlasRatio = 0
    static sampler

    static initialize() {
        lightsToUpdate = DirectionalShadows.lightsToUpdate
    }

    static allocateBuffers(shadowAtlasQuantity, shadowMapResolution) {
        if (DirectionalShadows.maxResolution !== shadowMapResolution && shadowMapResolution) {
            DirectionalShadows.maxResolution = shadowMapResolution
            StaticFBO.updateDirectionalShadowsFBO()
            DirectionalShadows.changed = true
        }

        if (DirectionalShadows.maxResolution / shadowAtlasQuantity !== DirectionalShadows.resolutionPerTexture && shadowAtlasQuantity) {
            DirectionalShadows.resolutionPerTexture = DirectionalShadows.maxResolution / shadowAtlasQuantity
            DirectionalShadows.changed = true
        }
        DirectionalShadows.atlasRatio = DirectionalShadows.maxResolution / DirectionalShadows.resolutionPerTexture
        LightsAPI.lightsMetadataUBO.bind()
        LightsAPI.lightsMetadataUBO.updateData("shadowMapsQuantity", new Float32Array([shadowAtlasQuantity]))
        LightsAPI.lightsMetadataUBO.updateData("shadowMapResolution", new Float32Array([DirectionalShadows.maxResolution]))
        LightsAPI.lightsMetadataUBO.unbind()
    }


    static execute() {
        if (!DirectionalShadows.changed && lightsToUpdate.length === 0)
            return;
        GPU.context.cullFace(GPU.context.FRONT)
        let currentColumn = 0, currentRow = 0

        StaticFBO.shadows.startMapping()
        GPU.context.enable(GPU.context.SCISSOR_TEST)
        const size = DirectionalShadows.atlasRatio ** 2
        for (let face = 0; face < size; face++) {
            if (face < lightsToUpdate.length) {
                const currentLight = lightsToUpdate[face]

                GPU.context.viewport(
                    currentColumn * DirectionalShadows.resolutionPerTexture,
                    currentRow * DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture
                )
                GPU.context.scissor(
                    currentColumn * DirectionalShadows.resolutionPerTexture,
                    currentRow * DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture,
                    DirectionalShadows.resolutionPerTexture
                )


                currentLight.atlasFace = [currentColumn, 0]
                DirectionalShadows.loopMeshes(currentLight)
            }
            if (currentColumn > DirectionalShadows.atlasRatio) {
                currentColumn = 0
                currentRow += 1
            } else
                currentColumn += 1
        }
        GPU.context.disable(GPU.context.SCISSOR_TEST)
        StaticFBO.shadows.stopMapping()
        GPU.context.cullFace(GPU.context.BACK)
        DirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(light) {
        if (!light.__entity)
            return
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        for (let m = 0; m < size; m++) {
            const current = toRender[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = current.__meshRef
            if (!mesh || !meshComponent.castsShadows || !current.active || current.__materialRef?.isSky)
                continue
            StaticShaders.directShadows.bind()
            const U = StaticShaders.directShadowsUniforms

            GPU.context.uniformMatrix4fv(U.viewMatrix, false, light.lightView)
            GPU.context.uniformMatrix4fv(U.transformMatrix, false, current.matrix)
            GPU.context.uniformMatrix4fv(U.projectionMatrix, false, light.lightProjection)

            mesh.draw()
        }
    }

}