import RootCameraInstance from "./instances/RootCameraInstance";
import RenderingWrapper from "./systems/RenderingWrapper";
import brdfImg from "./utils/brdf_lut.jpg";
import {createTexture} from "./utils/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "./templates/DATA_TYPES";
import ImageProcessor from "./utils/image/ImageProcessor";
import {v4} from "uuid";
import SYSTEMS from "./templates/SYSTEMS";
import FramebufferInstance from "./instances/FramebufferInstance";
import RenderingPackager from "./RenderingPackager";
import getSystemKey from "./utils/getSystemKey";

export default class Renderer {

    rootCamera = new RootCameraInstance()
    viewTarget = this.rootCamera
    packager = new RenderingPackager()
    canRun = true
    data = {}
    params = {}
    #systems = {}

    constructor(gpu, resolution, systems) {
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
            }, () => this._ready = true, v4())

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
    }


    get systems() {
        return this.#systems
    }

    callback() {
        const elapsed = performance.now() - this.then

        if (elapsed > this.fpsInterval) {
            const now = performance.now()
            this.then = now - (elapsed % this.fpsInterval);
            this.params.onBeforeRender()
            this.params.elapsed = elapsed

            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            for (let s = 0; s < this.sortedSystems.length; s++) {
                this.#systems[this.sortedSystems[s]]
                    .execute(
                        this.params,
                        this.#systems,
                        this.data,
                        this.filteredEntities,
                        this.data.entitiesMap,
                        () => this.data = {...this.data, ...this.packager.getLightsUniforms(this.data.pointLights, this.data.directionalLights)})
            }
            this.wrapper.execute(this.params, this.#systems, this.data, this.filteredEntities, this.data.entitiesMap, this.params.onWrap, this.postProcessingFramebuffers)
        }
        if (this.canRun)
            requestAnimationFrame(() => this.callback())
    }

    start() {
        this.canRun = true
        requestAnimationFrame(() => this.callback())
    }

    stop() {
        this.resizeObs?.disconnect()
        this.canRun = false
    }


    updatePackage(entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {

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
            fallbackMaterial: this.fallbackMaterial
        })

        this.data = packageData.data
        this.params = packageData.attributes
        this.filteredEntities = packageData.filteredEntities


        this.resizeObs = new ResizeObserver(() => {
            if (this.canvas) {
                const bBox = this.canvas.getBoundingClientRect()
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        })
        this.resizeObs.observe(this.canvas)
        this.fpsInterval = 1000 / (this.params.frameRate ? this.params.frameRate : 75);
        this.then = performance.now()
    }
}
