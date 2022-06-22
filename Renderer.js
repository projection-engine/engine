import RootCameraInstance from "./instances/RootCameraInstance"
import RenderingWrapper from "./systems/RenderingWrapper"

import {createTexture} from "./utils/utils"
import MaterialInstance from "./instances/MaterialInstance"
import * as shaderCode from "./shaders/mesh/FALLBACK.glsl"
import {DATA_TYPES} from "./templates/DATA_TYPES"
import ImageProcessor from "./utils/image/ImageProcessor"
import {v4} from "uuid"
import SYSTEMS from "./templates/SYSTEMS"
import FramebufferInstance from "./instances/FramebufferInstance"
import Packager from "./Packager"
import systemInstance from "./utils/systemInstance"
import VBOInstance from "./instances/VBOInstance"
import COMPONENTS from "./templates/COMPONENTS"

export default class Renderer {
    rootCamera = new RootCameraInstance()
    frameID = undefined
    data = {}
    params = {}
    #systems = {}
    #ready = false

    constructor( resolution, systems) {
        console.trace(resolution, systems)
        const gpu = window.gpu
        Promise.all([import("./templates/CUBE"), import("./templates/BRDF.json")])
            .then(async res => {
                const [cube, BRDF] = res
                this.brdf = createTexture( 512, 512, gpu.RGBA32F, 0, gpu.RGBA, gpu.FLOAT, await ImageProcessor.getImageBitmap(BRDF.data), gpu.LINEAR, gpu.LINEAR, gpu.CLAMP_TO_EDGE, gpu.CLAMP_TO_EDGE)

                this.fallbackMaterial = new MaterialInstance( 
                    shaderCode.vertex, 
                    shaderCode.fragment, 
                    [{key: "brdfSampler", data: this.brdf, type: DATA_TYPES.UNDEFINED}],
                    {
                        isForward: false,
                        faceCulling: true,
                        cullBackFace: true
                    }, 
                    undefined,
                    v4(),
                    shaderCode.cubeMapShader)

                this.params.fallbackMaterial = this.fallbackMaterial
                this.params.brdf = this.brdf
                this.cubeBuffer = new VBOInstance(1, new Float32Array(cube.default), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
                this.data.cubeBuffer = this.cubeBuffer
                this.#ready = true
                this.start()
            }).catch(err => console.error(err))

        this.packager = new Packager()
        this.wrapper = new RenderingWrapper(resolution)
        const a = new FramebufferInstance(), b = new FramebufferInstance()
        a.texture().depthTest()
        b.texture()


        this.postProcessingFramebuffers = {
            a: a,
            b: b
        }

        const sys = [...systems, SYSTEMS.MESH]
        sys.forEach(s => {
            let system = systemInstance(s, resolution)
            if (system)
                this.#systems[s] = system
        })
        this.sortedSystems = Object.keys(this.#systems).sort()
        this.resizeObs = new ResizeObserver(() => {
            const bBox = window.gpu.canvas.getBoundingClientRect()
            if (this.params.camera) {
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        })
        this.resizeObs.observe(window.gpu.canvas)
    }
    
    get systems() {
        return this.#systems
    }

    callback() {
        this.params.elapsed = performance.now() - this.then
        window.gpu.clear(window.gpu.COLOR_BUFFER_BIT | window.gpu.DEPTH_BUFFER_BIT)
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
    }

    stop() {
        cancelAnimationFrame(this.frameID)
        this.frameID = undefined
    }


    updatePackage(fallbackMaterial = this.fallbackMaterial, entities, materials, meshes, params,  onWrap, levelScript) {

        const packageData = this.packager.makePackage({
            entities,
            materials,
            meshes,
            params,
            onWrap, 
            brdf: this.brdf,
            fallbackMaterial: fallbackMaterial,
            cubeBuffer: this.cubeBuffer,
            levelScript
        })
        this.data = {...packageData.data, cubeBuffer: this.cubeBuffer}
        this.params = packageData.attributes
        this.filteredEntities = packageData.filteredEntities
        this.then = performance.now()

        const bBox = window.gpu.canvas.getBoundingClientRect()
        if (this.params.camera) {
            this.params.camera.aspectRatio = bBox.width / bBox.height
            this.params.camera.updateProjection()
        }
        this.params.lastFrame = this.wrapper.frameBuffer.colors[0]
    }

    static drawMaterial(mesh, material) {
        const gpu = window.gpu
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

    static getEnvironment(entity) {
        const comp = entity.components[COMPONENTS.MATERIAL]
        const cube = comp.cubeMap
        return {
            irradianceMultiplier: comp.irradianceMultiplier,
            irradiance0: comp.irradiance[0]?.ref,
            irradiance1: comp.irradiance[1]?.ref,
            irradiance2: comp.irradiance[2]?.ref,
            prefilteredMap: cube?.prefiltered,
            ambientLODSamples: cube?.prefilteredLod
        }
    }
}
