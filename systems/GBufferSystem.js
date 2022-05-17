import System from "../basic/System";
import FramebufferInstance from "../instances/FramebufferInstance";
import SYSTEMS from "../templates/SYSTEMS";
import COMPONENTS from "../templates/COMPONENTS";
import Renderer from "../Renderer";

export default class GBufferSystem extends System {
    lastMaterial

    constructor(gpu, resolution = {w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({attachment: 0, precision: this.gpu.RGBA32F, format: this.gpu.RGBA, type: this.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()
    }

    execute(options, systems, data) {
        super.execute()
        const {
            meshes,
            skybox,
            materials,
            meshSources,
            cubeMapsSources,
        } = data

        const {
            elapsed,
            camera,
            fallbackMaterial,
            brdf
        } = options
        this.frameBuffer.startMapping()
        this.lastMaterial = undefined
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const t = current.components[COMPONENTS.TRANSFORM]
                const currentMaterial = materials[current.components[COMPONENTS.MATERIAL].materialID]

                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : fallbackMaterial
                if (!mat || !mat.ready)
                    mat = fallbackMaterial
                const ambient = Renderer.getEnvironment(current, skybox)

                this.drawMesh(
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat,
                    current.components[COMPONENTS.MESH].normalMatrix,
                    undefined,
                    current.components[COMPONENTS.MATERIAL],

                    ambient.irradianceMap,
                    ambient.prefilteredMap,
                    ambient.prefilteredLod,
                    elapsed,
                    brdf
                )
            }
        }
        this.gpu.bindVertexArray(null)
        this.frameBuffer.stopMapping()
    }

    drawMesh(
        mesh,
        camPosition,
        viewMatrix,
        projectionMatrix,
        transformMatrix,
        material,
        normalMatrix,
        indexSelected,
        materialComponent,
        closestIrradiance,
        closestPrefiltered,
        prefilteredLod,
        elapsed,
        brdf
    ) {


        if (material && !material.settings?.isForwardShaded) {

            mesh.use()
            material.use(this.lastMaterial !== material.id, {
                projectionMatrix,
                transformMatrix,
                viewMatrix,

                normalMatrix,
                indexSelected,

                brdfSampler: brdf,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                irradianceMap: closestIrradiance,
                prefilteredMapSampler: closestPrefiltered,
                ambientLODSamples: prefilteredLod,
                ...(materialComponent.overrideMaterial ? materialComponent.uniformValues : {})
            })
            this.lastMaterial = material.id

            Renderer.drawMaterial(mesh, material, this.gpu)
        }
    }
}