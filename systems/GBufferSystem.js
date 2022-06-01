import System from "../basic/System"
import FramebufferInstance from "../instances/FramebufferInstance"
import COMPONENTS from "../templates/COMPONENTS"
import Renderer from "../Renderer"
import ForwardSystem from "./ForwardSystem"

export default class GBufferSystem extends System {
    lastMaterial

    constructor(gpu, resolution = {w: window.screen.width, h: window.screen.height}) {
        super([])
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
            meshSources
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

                    elapsed,
                    ambient,
                    lastMaterial: this.lastMaterial,
                    gpu: this.gpu,
                    onlyForward: false
                })
            }
        }
        this.gpu.bindVertexArray(null)
        this.frameBuffer.stopMapping()
    }
}