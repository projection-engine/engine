import COMPONENTS from "../../../data/COMPONENTS"
import MaterialRenderer from "../../../services/MaterialRenderer";
import EngineLoop from "../../loop/EngineLoop";
import Renderer from "../../../Renderer";

let aoTexture
export default class ForwardPass {
    lastMaterial

    execute() {
        if (aoTexture === undefined)
            aoTexture = EngineLoop.renderMap.get("ao").texture

        const {
            meshes,
            materials,
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = Renderer.data

        const {
            elapsed,
            camera
        } = Renderer.params

        this.lastMaterial = undefined

        MaterialRenderer.loopMeshes(
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