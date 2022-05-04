import RootCameraInstance from "./instances/RootCameraInstance";
import RenderingWrapper from "./systems/RenderingWrapper";
import brdfImg from "./utils/brdf_lut.jpg";
import {createTexture} from "./utils/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "../views/blueprints/components/DATA_TYPES";
import ImageProcessor from "./utils/image/ImageProcessor";
import {v4} from "uuid";
import GBufferSystem from "./systems/GBufferSystem";
import SYSTEMS from "./templates/SYSTEMS";
import FramebufferInstance from "./instances/FramebufferInstance";
import RenderingPackager from "./RenderingPackager";

export default class Renderer {
    _currentFrame = 0
    rootCamera = new RootCameraInstance()
    viewTarget = this.rootCamera
    packager = new RenderingPackager()

    data = {}
    params = {}
    #systems = {}
    constructor(gpu, resolution) {
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolution)
        this.GBufferSystem = new GBufferSystem(gpu, resolution)

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

        this.postProcessingFramebuffers = [a, b]
    }

    callback() {
        const elapsed = performance.now() - this.then
        this._currentFrame = requestAnimationFrame(() => this.callback());

        if (elapsed > this.fpsInterval) {
            const now = performance.now()
            this.then = now - (elapsed % this.fpsInterval);
            this.params.onBeforeRender()
            this.params.elapsed = elapsed

            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            for (let s = 0; s < this.sortedSystems.length; s++) {
                this.#systems[this.sortedSystems[s]]
                    .execute(this.params, this.#systems, this.data, this.filteredEntities, this.data.entitiesMap)
            }
            this.wrapper.execute(this.params, this.#systems, this.data, this.filteredEntities, this.data.entitiesMap, this.params.onWrap, this.postProcessingFramebuffers)
        }
    }

    start() {
        this._currentFrame = requestAnimationFrame(() => this.callback())
    }
    stop() {
        this.resizeObs?.disconnect()
        cancelAnimationFrame(this._currentFrame)
    }

    updatePackage(s, entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {
        this.#systems = {...s, [SYSTEMS.MESH]: this.GBufferSystem}
        this.sortedSystems = Object.keys(this.#systems).sort()
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

        const canvasRef = this.gpu.canvas
        this.resizeObs = new ResizeObserver(() => {
            if (canvasRef) {
                const bBox = canvasRef.getBoundingClientRect()
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        })
        this.resizeObs.observe(canvasRef)
        this.fpsInterval = 1000 / (this.params.frameRate ? this.params.frameRate : 75);
        this.then = performance.now()
    }
}
