import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import EngineLoop from "../../loop/EngineLoop";

let aoTexture
export default class ForwardPass {
    lastMaterial

    execute(options, data) {
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
            camera
        } = options

        this.lastMaterial = undefined

        MaterialRenderer.loopMeshes(
            meshesMap,
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isForwardShaded)
                    return
                const transformationComponent = current.components[COMPONENTS.TRANSFORM]
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
                    lastMaterial: this.lastMaterial,
                    ao: aoTexture
                })
                this.lastMaterial = mat?.id
            }
        )
    }
}