import RootCameraInstance from "./instances/RootCameraInstance"
import RenderingWrapper from "./systems/RenderingWrapper"

import {createTexture} from "./utils/utils"
import MaterialInstance from "./instances/MaterialInstance"
import * as shaderCode from "./shaders/mesh/FALLBACK.glsl"
import * as skyboxShaderCode from "./shaders/SKYBOX.glsl"
import {DATA_TYPES} from "./templates/DATA_TYPES"
import ImageProcessor from "./utils/image/ImageProcessor"
import {v4} from "uuid"
import SYSTEMS from "./templates/SYSTEMS"
import FramebufferInstance from "./instances/FramebufferInstance"
import RenderingPackager from "./RenderingPackager"
import systemInstance from "./utils/systemInstance"
import VBOInstance from "./instances/VBOInstance"
import ShaderInstance from "./instances/ShaderInstance"
import COMPONENTS from "./templates/COMPONENTS"

export default class Renderer {
    static VECTOR3 = [1,1,1]
    rootCamera = new RootCameraInstance()
    tried = false
    frameID = undefined
    data = {}
    params = {}
    #systems = {}
    #ready = false

    constructor(gpu, resolution, systems, projectID) {
        this.skyboxShader = new ShaderInstance(skyboxShaderCode.vertex, skyboxShaderCode.fragment, gpu)
        Promise.all([import("./templates/CUBE"), import("./templates/BRDF.json")])
            .then(async res => {
                const [cube, BRDF] = res
                this.brdf = createTexture(gpu, 512, 512, gpu.RGBA32F, 0, gpu.RGBA, gpu.FLOAT, await ImageProcessor.getImageBitmap(BRDF.data), gpu.LINEAR, gpu.LINEAR, gpu.CLAMP_TO_EDGE, gpu.CLAMP_TO_EDGE)

                this.fallbackMaterial = new MaterialInstance(this.gpu, shaderCode.vertex, shaderCode.fragment, [{
                    key: "brdfSampler", data: this.brdf, type: DATA_TYPES.UNDEFINED
                }], {
                    isForward: false,
                    rsmAlbedo: await ImageProcessor.colorToImage("rgba(128, 128, 128, 1)"),
                    doubledSided: true
                },
                () => this._ready = true, v4(),
                shaderCode.cubeMapShader)

                this.params.fallbackMaterial = this.fallbackMaterial
                this.params.brdf = this.brdf
                this.cubeBuffer = new VBOInstance(gpu, 1, new Float32Array(cube.default), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
                this.data.cubeBuffer = this.cubeBuffer
                this.#ready = true
                if (this.tried) {
                    this.start()
                }
            }).catch(err => console.log(err))

        this.packager = new RenderingPackager(gpu)
        this.canvas = gpu.canvas
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolution)

        const a = new FramebufferInstance(gpu), b = new FramebufferInstance(gpu)
        a.texture().depthTest()
        b.texture()


        this.postProcessingFramebuffers = {
            a: a,
            b: b
        }

        const sys = [...systems, SYSTEMS.MESH]
        sys.forEach(s => {
            let system = systemInstance(s, gpu, resolution, projectID)
            if (system)
                this.#systems[s] = system
        })
        this.sortedSystems = Object.keys(this.#systems).sort()
        this.resizeObs = new ResizeObserver(() => {
            if (this.canvas) {
                const bBox = this.canvas.getBoundingClientRect()
                if (this.params.camera) {
                    this.params.camera.aspectRatio = bBox.width / bBox.height
                    this.params.camera.updateProjection()
                }
            }
        })
        this.resizeObs.observe(this.canvas)
    }


    get systems() {
        return this.#systems
    }

    callback() {
        this.params.elapsed = performance.now() - this.then
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
        const l = this.sortedSystems.length
        for (let s = 0; s < l; s++) {
            this.#systems[this.sortedSystems[s]]
                .execute(
                    this.params,
                    this.#systems,
                    this.data,
                    this.filteredEntities,
                    this.data.entitiesMap,
                    () => this.data = {...this.data, ...this.packager.getLightsUniforms(this.data.pointLights, this.data.directionalLights)}
                )
        }
        this.wrapper.execute(this.params, this.#systems, this.data, this.filteredEntities, this.data.entitiesMap, this.params.onWrap, this.postProcessingFramebuffers)

        this.frameID = requestAnimationFrame(() => this.callback())
    }


    start() {
        if (this.#ready && !this.frameID)
            this.frameID = requestAnimationFrame(() => this.callback())
        else
            this.tried = true

    }

    stop() {
        cancelAnimationFrame(this.frameID)
        this.frameID = undefined
    }


    updatePackage(fallbackMaterial = this.fallbackMaterial, entities, materials, meshes, params, scripts = [], onWrap) {

        const packageData = this.packager.makePackage({
            entities,
            materials,
            meshes,
            params,
            scripts,

            onWrap,
            gpu: this.gpu,
            brdf: this.brdf,
            fallbackMaterial: fallbackMaterial,
            cubeBuffer: this.cubeBuffer
        })
        this.data = {...packageData.data, cubeBuffer: this.cubeBuffer, skyboxShader: this.skyboxShader}
        this.params = packageData.attributes
        this.filteredEntities = packageData.filteredEntities
        this.then = performance.now()

        const bBox = this.canvas.getBoundingClientRect()
        if (this.params.camera) {
            this.params.camera.aspectRatio = bBox.width / bBox.height
            this.params.camera.updateProjection()
        }
    }

    static drawMaterial(mesh, material, gpu) {
        if (material.settings.doubleSided)
            gpu.disable(gpu.CULL_FACE)
        else if (material.settings.cullFace)
            gpu.cullFace(gpu[material.settings?.cullFace])
        if (material.settings.depthMask === false)
            gpu.depthMask(false)
        if (material.settings.depthTest === false)
            gpu.disable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.disable(gpu.BLEND)
        else if (material.settings.blendFunc)
            gpu.blendFunc(gpu[material.settings.blendFuncSource], gpu[material.settings?.blendFuncTarget])

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        if (material.settings.doubleSided)
            gpu.enable(gpu.CULL_FACE)
        if (material.settings.depthMask === false)
            gpu.depthMask(true)
        if (material.settings.depthTest === false)
            gpu.enable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.enable(gpu.BLEND)

    }

    static getEnvironment(entity, skybox) {
        const fallback = skybox?.cubeMap ? skybox.cubeMap : {}
        const comp = entity.components[COMPONENTS.MATERIAL]
        const irradiance0 = comp.irradiance[0]?.ref
        const cube = comp.cubeMap
        return {
            irradianceMultiplier: comp.irradianceMultiplier ? comp.irradianceMultiplier :Renderer.VECTOR3,
            irradiance0: irradiance0 ? irradiance0 : fallback.irradianceTexture,//fallback.irradianceTexture,
            irradiance1: comp.irradiance[1]?.ref,
            irradiance2: comp.irradiance[2]?.ref,

            prefilteredMap: cube ? cube.prefiltered : fallback.prefiltered,
            ambientLODSamples: cube ? cube.prefilteredLod : skybox?.prefilteredMipmaps
        }
    }
}
