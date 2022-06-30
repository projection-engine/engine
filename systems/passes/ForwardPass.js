import System from "../../basic/System"
import COMPONENTS from "../../templates/COMPONENTS"
import Renderer from "../../Renderer"

let  aoTexture
export default class ForwardPass extends System {
    lastMaterial
    constructor() {
        super()
    }
    execute(options, data, sceneColor) {
        if (aoTexture === undefined)
            aoTexture = window.renderer.renderingPass.ao.texture

        const {
            meshes,
            materials,
            meshSources,
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData,

        } = data


        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf,
            shadingModel
        } = options

        this.lastMaterial = undefined
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {

                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready) {
                    mat = fallbackMaterial
                }
                const ambient = window.renderer.getEnvironment(current)
                ForwardPass.drawMesh({
                    mesh,
                    camPosition: camera.position,
                    viewMatrix: camera.viewMatrix,
                    projectionMatrix: camera.projectionMatrix,
                    transformMatrix: t.transformationMatrix,
                    material: mat,
                    normalMatrix: current.components[COMPONENTS.MESH].normalMatrix,
                    materialComponent: current.components[COMPONENTS.MATERIAL],
                    brdf,

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
        }
        window.gpu.bindVertexArray(null)
    }

    static drawMesh({
        useCubeMapShader,
        mesh,
        camPosition,
        viewMatrix,
        projectionMatrix,
        transformMatrix,
        material,
        normalMatrix,
        materialComponent,
        brdf,
        directionalLightsQuantity,
        directionalLightsData,
        dirLightPOV,
        pointLightsQuantity,
        pointLightData,
        elapsed,
        ambient,
        sceneColor,
        lastMaterial,
        ao,
        shadingModel,
        onlyForward
    }) {
        if (mesh && material && (!onlyForward || (onlyForward && (material.settings?.isForwardShaded || useCubeMapShader && material.hasCubeMap)))) {
            mesh.use()
            material.use(lastMaterial !== material.id, {
                ...ambient,
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,
                sceneColor,
                brdfSampler: brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,

                shadingModel,
                directionalLightsData,
                directionalLightsQuantity,

                dirLightPOV,
                aoSampler: ao,
                lightQuantity: pointLightsQuantity,
                pointLightData,
                ...(materialComponent.overrideMaterial ? materialComponent.uniformValues : {})
            }, useCubeMapShader)

            Renderer.drawMaterial(mesh, material)
        }
    }
}