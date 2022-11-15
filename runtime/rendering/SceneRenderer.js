import Engine from "../../Engine";
import MaterialAPI from "../../lib/rendering/MaterialAPI";
import GBuffer from "./GBuffer";
import FALLBACK_MATERIAL from "../../static/FALLBACK_MATERIAL";
import UBO from "../../instances/UBO";

export default class SceneRenderer{
    static drawDeferred(){
        const uniforms = GBuffer.uniforms
        const deferred = MaterialAPI.deferredShadedEntities

        GBuffer.gBuffer.startMapping()

        let size = deferred.length
        for (let m = 0; m < size; m++) {
            const current = deferred[m]
            const entity = current.entity
            if (!entity.active)
                continue
            const material = current.material



            if(material.refID === FALLBACK_MATERIAL){
                const shader = material.shader
                shader.bind()
                const uniformMap = shader.uniformMap
                const uData = material.uniformData

                gpu.activeTexture(gpu.TEXTURE0)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.albedo)
                gpu.uniform1i(uniformMap.albedo, 0)

                gpu.activeTexture(gpu.TEXTURE1)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.normal)
                gpu.uniform1i(uniformMap.normal, 1)

                gpu.activeTexture(gpu.TEXTURE2)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.roughness)
                gpu.uniform1i(uniformMap.roughness, 2)

                gpu.activeTexture(gpu.TEXTURE3)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.metallic)
                gpu.uniform1i(uniformMap.metallic, 3)

                gpu.activeTexture(gpu.TEXTURE4)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.ao)
                gpu.uniform1i(uniformMap.ao, 4)

                gpu.activeTexture(gpu.TEXTURE5)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.emission)
                gpu.uniform1i(uniformMap.emission, 5)

                gpu.activeTexture(gpu.TEXTURE6)
                gpu.bindTexture(gpu.TEXTURE_2D, uData.heightMap)
                gpu.uniform1i(uniformMap.heightMap, 6)

                gpu.uniformMatrix3fv(uniformMap.settings, false, uData.settings)
                gpu.uniformMatrix3fv(uniformMap.rgbSamplerScales, false, uData.rgbSamplerScales)
                gpu.uniformMatrix3fv(uniformMap.linearSamplerScales, false, uData.linearSamplerScales)
                gpu.uniformMatrix3fv(uniformMap.fallbackValues, false, uData.fallbackValues)
                gpu.uniformMatrix4fv(uniformMap.uvScales, false, uData.uvScales)

                gpu.uniformMatrix4fv(uniformMap.previousModelMatrix, false, entity.previousModelMatrix)
                gpu.uniformMatrix4fv(uniformMap.transformMatrix, false, entity.matrix)

                gpu.uniform3fv(uniformMap.meshID, entity.pickID)
                current.mesh.draw()
            }else {
                uniforms.previousModelMatrix = entity.previousModelMatrix
                uniforms.transformMatrix = entity.matrix
                uniforms.meshID = entity.pickID
                MaterialAPI.drawMesh(
                    entity.id,
                    current.mesh,
                    material,
                    current.component,
                    uniforms
                )
            }
        }
        GBuffer.gBuffer.stopMapping()
    }
}