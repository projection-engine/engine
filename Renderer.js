import RootCameraInstance from "./instances/RootCameraInstance"


import {createTexture} from "./utils/utils"
import MaterialInstance from "./instances/MaterialInstance"
import * as shaderCode from "./shaders/mesh/FALLBACK.glsl"
import {DATA_TYPES} from "./templates/DATA_TYPES"
import ImageProcessor from "./utils/image/ImageProcessor"
import Packager from "./Packager"
import VBOInstance from "./instances/VBOInstance"
import ENVIRONMENT from "./ENVIRONMENT"
import Picking from "./systems/misc/Picking"
import MiscellaneousPass from "./systems/MiscellaneousPass"
import RenderingPass from "./systems/RenderingPass"
import PostProcessingPass from "./systems/PostProcessingPass"
import FALLBACK_MATERIAL from "../../static/misc/FALLBACK_MATERIAL"

let gpu, specularProbes = {}, diffuseProbes = {}
export default class Renderer {
    environment = ENVIRONMENT.PROD
    rootCamera = new RootCameraInstance()
    frameID = undefined
    data = {}
    params = {}
    #ready = false
    then = 0
    entities = []

    constructor( resolution) {

        gpu = window.gpu
        Promise.all([import("./templates/CUBE"), import("./templates/BRDF.json")])
            .then(async res => {
                const [cube, BRDF] = res
                this.brdf = createTexture( 512, 512, gpu.RGBA32F, 0, gpu.RGBA, gpu.FLOAT, await ImageProcessor.getImageBitmap(BRDF.data), gpu.LINEAR, gpu.LINEAR, gpu.CLAMP_TO_EDGE, gpu.CLAMP_TO_EDGE)
                this.params.brdf = this.brdf
                this.cubeBuffer = new VBOInstance(1, new Float32Array(cube.default), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
                this.data.cubeBuffer = this.cubeBuffer
                this.#ready = true
                this.start()
            }).catch(err => console.error(err))

        this.picking = new Picking()
        this.miscellaneousPass = new MiscellaneousPass(resolution)
        this.renderingPass = new RenderingPass(resolution)
        this.postProcessingPass = new PostProcessingPass(resolution)
        specularProbes = this.renderingPass.specularProbe.probes
        diffuseProbes = this.renderingPass.diffuseProbe.probes
        // CAMERA ASPECT RATIO OBSERVER
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            if (this.params.camera) {
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        }).observe(gpu.canvas)
    }

    callback() {
        this.params.elapsed = performance.now() - this.then
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        this.miscellaneousPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            () => Packager.lights(this.data)
        )
        this.renderingPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            () => Packager.lights(this.data),
            this.params.onWrap
        )
        this.postProcessingPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            this.params.onWrap
        )

        this.frameID = requestAnimationFrame(() => this.callback())
    }

    start() {
        if (this.#ready && !this.frameID)
            this.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(this.frameID)
        this.frameID = undefined
    }

    static drawMaterial(mesh, material) {

        // if (material.settings.faceCulling === false)
        //     gpu.disable(gpu.CULL_FACE)
        // else {
        //     gpu.enable(gpu.CULL_FACE)
        //     if(material.settings.cullBackFace)
        //         gpu.cullFace(gpu.BACK)
        //     else
        //         gpu.cullFace(gpu.FRONT)
        // }
        if (material.settings.depthMask === false)
            gpu.depthMask(false)
        if (material.settings.depthTest === false)
            gpu.disable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.disable(gpu.BLEND)
        else if (material.settings.blendFunc)
            gpu.blendFunc(gpu[material.settings.blendFuncSource], gpu[material.settings?.blendFuncTarget])

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        if (material.settings.depthMask === false)
            gpu.depthMask(true)
        if (material.settings.depthTest === false)
            gpu.enable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.enable(gpu.BLEND)

    }

    getEnvironment(entity) {
        const specular = specularProbes[entity.id]
        const diffuse = diffuseProbes[entity.id]

        if(diffuse)
            return {
                irradiance0: diffuse[0]?.texture,
                irradiance1: diffuse[1]?.texture,
                irradiance2: diffuse[2]?.texture,
                
                prefilteredMap: specular?.texture,
                ambientLODSamples:  specular?.mipmaps
            }
        return {
            prefilteredMap: specular?.texture,
            ambientLODSamples:  specular?.mipmaps
        }
    }
}
