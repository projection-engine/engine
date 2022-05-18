import System from "../basic/System";
import COMPONENTS from "../templates/COMPONENTS";
import SYSTEMS from "../templates/SYSTEMS";
import Renderer from "../Renderer";

export default class ForwardSystem extends System {
    lastMaterial
    cubeMapsConsumeMap = {}

    constructor(gpu) {
        super([]);
        this.gpu = gpu
    }

    execute(options, systems, data, sceneColor) {
        super.execute()
        if (this.aoTexture === undefined && systems[SYSTEMS.AO])
            this.aoTexture = systems[SYSTEMS.AO].texture
        const {
            meshes,
            skybox,
            materials,
            meshSources,
            cubeMapsSources,
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
        let valid = true
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {

                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready) {
                    valid = false
                    mat = fallbackMaterial
                }
                const ambient = Renderer.getEnvironment(current, skybox)
                ForwardSystem.drawMesh({
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
                    gpu: this.gpu,
                    ao: this.aoTexture,
                    shadingModel,
                    onlyForward: true
                })

                this.lastMaterial = mat?.id
            }
        }
        this.gpu.bindVertexArray(null)
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
                        gpu,
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

          Renderer.drawMaterial(mesh, material, gpu)
        }
    }
}