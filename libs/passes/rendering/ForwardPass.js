import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import EngineLoop from "../../loop/EngineLoop";

let  aoTexture
export default class ForwardPass {
    lastMaterial
    execute(options, data, sceneColor) {
        if (aoTexture === undefined)
            aoTexture = EngineLoop.renderMap.get("ao").texture

        const {
            meshes,
            materials,
            meshesMap,
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = data

        const {
            elapsed,
            camera,
            shadingModel
        } = options

        this.lastMaterial = undefined
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            if(!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = meshesMap.get(meshComponent.meshID)
            if(!mesh)
                continue
            const transformationComponent = current.components[COMPONENTS.TRANSFORM]

            const mat = materials[meshComponent.materialID]
            if (!mat || !mat.ready) 
                continue
            const ambient = MaterialRenderer.getEnvironment(current)
            MaterialRenderer.drawMesh({
                mesh,
                camPosition: camera.position,
                viewMatrix: camera.viewMatrix,
                projectionMatrix: camera.projectionMatrix,
                transformMatrix: transformationComponent.transformationMatrix,
                material: mat,
                normalMatrix: meshComponent.normalMatrix,
                materialComponent: meshComponent,
                directionalLightsQuantity: maxTextures,
                directionalLightsData,
                dirLightPOV,
                pointLightsQuantity,
                pointLightData,
                elapsed,
                ambient,
                sceneColor,
                lastMaterial: this.lastMaterial,
                ao: aoTexture,
                shadingModel,
                onlyForward: true
            })

            this.lastMaterial = mat?.id
      
        }
        window.gpu.bindVertexArray(null)
    }
}