import RootCameraInstance from "./instances/RootCameraInstance";
import RenderingWrapper from "./systems/RenderingWrapper";
import brdfImg from "./utils/brdf_lut.jpg";
import {createTexture} from "./utils/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/FALLBACK.glsl";
import * as skyboxShaderCode from "./shaders/SKYBOX.glsl";
import {DATA_TYPES} from "./templates/DATA_TYPES";
import ImageProcessor from "./utils/image/ImageProcessor";
import {v4} from "uuid";
import SYSTEMS from "./templates/SYSTEMS";
import FramebufferInstance from "./instances/FramebufferInstance";
import RenderingPackager from "./RenderingPackager";
import getSystemKey from "./utils/getSystemKey";
import VBO from "./instances/VBO";
import cube from "./templates/CUBE";
import ShaderInstance from "./instances/ShaderInstance";

export default class Renderer {

    rootCamera = new RootCameraInstance()
    viewTarget = this.rootCamera

    frameID = undefined
    data = {}
    params = {}
    #systems = {}

    constructor(gpu, resolution, systems) {
        this.skyboxShader = new ShaderInstance(skyboxShaderCode.vertex, skyboxShaderCode.fragment, gpu)
        this.cubeBuffer = new VBO(gpu, 1, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        this.packager = new RenderingPackager(gpu)
        this.canvas = gpu.canvas
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolution)

        const brdf = new Image()

        brdf.src = brdfImg
        brdf.decode().then(async () => {
            this.brdf = createTexture(gpu, 512, 512, gpu.RGBA32F, 0, gpu.RGBA, gpu.FLOAT, brdf, gpu.LINEAR, gpu.LINEAR, gpu.CLAMP_TO_EDGE, gpu.CLAMP_TO_EDGE)
            this.params.brdf = this.brdf
            this.fallbackMaterial = new MaterialInstance(this.gpu, shaderCode.vertex, shaderCode.fragment, [{
                    key: 'brdfSampler', data: this.brdf, type: DATA_TYPES.UNDEFINED
                }], {
                    isForward: false,
                    rsmAlbedo: await ImageProcessor.colorToImage('rgba(128, 128, 128, 1)'),
                    doubledSided: true
                },
                () => this._ready = true, v4(),
                shaderCode.cubeMapShader)
            this.params.fallbackMaterial = this.fallbackMaterial
        })
        const a = new FramebufferInstance(gpu), b = new FramebufferInstance(gpu)
        a.texture().depthTest()
        b.texture()


        this.postProcessingFramebuffers = {
            a: a,
            b: b
        }

        const sys = [...systems, SYSTEMS.MESH]
        sys.forEach(s => {
            let system = getSystemKey(s, gpu, resolution)
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
        const elapsed = performance.now() - this.then

        // if (elapsed > this.fpsInterval) {
        const now = performance.now()
        this.then = now - (elapsed % this.fpsInterval);
        this.params.onBeforeRender()
        this.params.elapsed = elapsed

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
        if (!this.frameID)
            this.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(this.frameID)
        this.frameID = undefined
    }


    updatePackage(fallbackMaterial=this.fallbackMaterial, entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {
        const packageData = this.packager.makePackage({
            entities,
            materials,
            meshes,
            params,
            scripts,
            onBeforeRender,
            onWrap,
            gpu: this.gpu,
            brdf: this.brdf,
            fallbackMaterial: fallbackMaterial,
            cubeBuffer: this.cubeBuffer
        })

        this.data = {...packageData.data, cubeBuffer: this.cubeBuffer, skyboxShader: this.skyboxShader}
        this.params = packageData.attributes
        this.filteredEntities = packageData.filteredEntities


        this.fpsInterval = 1000 / (this.params.frameRate ? this.params.frameRate : 75);
        this.then = performance.now()

    }
}
