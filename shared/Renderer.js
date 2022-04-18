import cloneClass from "../utils/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import toObject from "./utils/misc/toObject";
import RootCamera from "./RootCamera";
import RenderingWrapper from "./ecs/systems/RenderingWrapper";
import brdfImg from "../utils/brdf_lut.jpg";
import {createTexture} from "./utils/misc/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "../../views/blueprints/base/DATA_TYPES";
import ImageProcessor from "../utils/image/ImageProcessor";
import {v4} from "uuid";

export default class Renderer {
    _currentFrame = 0
    rootCamera = new RootCamera()
    viewTarget = this.rootCamera


    constructor(gpu, resolutionScale = 1) {
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolutionScale)
        const brdf = new Image()
        brdf.src = brdfImg
        brdf.decode().then(async () => {
            this.brdf = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA32F,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                brdf,
                gpu.LINEAR,
                gpu.LINEAR,
                gpu.CLAMP_TO_EDGE,
                gpu.CLAMP_TO_EDGE
            )
            this.fallbackMaterial = new MaterialInstance(
                this.gpu,
                shaderCode.fragment,
                [
                    {key: 'brdfSampler', data: this.brdf, type: DATA_TYPES.UNDEFINED}
                ],
                {
                    isForward: false,
                    rsmAlbedo: await ImageProcessor.colorToImage('rgba(128, 128, 128, 1)'),
                    doubledSided: true
                },
                () => {
                    this._ready = true
                },
                v4())
        })
    }

    callback(systems, onBeforeRender, onWrap) {
        onBeforeRender()
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
        for (let s = 0; s < this.sortedSystems.length; s++) {
            systems[this.sortedSystems[s]]
                .execute({
                        ...this.params,
                        camera: this.viewTarget,
                        elapsed: performance.now() - this._startedOn,
                        brdf: this.brdf,
                        fallbackMaterial: this.fallbackMaterial
                    },
                    systems,
                    this.data,
                    this.filteredEntities,
                    this.entitiesMap
                )
        }
        this.wrapper.execute({
                ...this.params,
                camera: this.viewTarget,
                elapsed: performance.now() - this._startedOn,
            },
            systems,
            this.data,
            this.filteredEntities,
            this.entitiesMap, onWrap)

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap));
    }

    start(systems, entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {
        const filteredEntities = this.filteredEntities = (params.canExecutePhysicsAnimation ? entities.map(e => cloneClass(e)) : entities).filter(e => e.active)
        this.data = {
            pointLights: filteredEntities.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
            spotLights: filteredEntities.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
            terrains: filteredEntities.filter(e => e.components[COMPONENTS.TERRAIN]),

            meshes: filteredEntities.filter(e => e.components[COMPONENTS.MESH]),
            skybox: filteredEntities.filter(e => e.components[COMPONENTS.SKYBOX] && e.active)[0]?.components[COMPONENTS.SKYBOX],
            directionalLights: filteredEntities.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            skylight: filteredEntities.filter(e => e.components.SkylightComponent && e.active)[0]?.components[COMPONENTS.SKYLIGHT],
            cubeMaps: filteredEntities.filter(e => e.components.CubeMapComponent),
            scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
            scripts: toObject(scripts),
            cameras: filteredEntities.filter(e => e.components[COMPONENTS.CAMERA])
        }

        this.entitiesMap = toObject(entities)
        this.data.cubeMapsSources = toObject(this.data.cubeMaps)
        this.sortedSystems = Object.keys(systems).sort()


        this.viewTarget = params.camera ? params.camera : this.rootCamera
        this._startedOn = performance.now()
        this.params = {...params, entitiesLength: this.filteredEntities.length}

        const canvasRef = this.gpu.canvas
        this.resizeObs = new ResizeObserver(() => {

            if (canvasRef) {
                const bBox = canvasRef.getBoundingClientRect()
                this.viewTarget.aspectRatio = bBox.width / bBox.height
                this.viewTarget.updateProjection()
            }
        })
        this.resizeObs.observe(canvasRef)

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap))
    }

    stop() {
        this.resizeObs?.disconnect()
        cancelAnimationFrame(this._currentFrame)
    }
}