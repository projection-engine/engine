import cloneClass from "../utils/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import toObject from "./utils/misc/toObject";
import RootCamera from "./RootCamera";
import RenderingWrapper from "./ecs/systems/RenderingWrapper";
import brdfImg from "../utils/brdf_lut.jpg";
import {createTexture} from "./utils/misc/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "../../views/blueprints/components/DATA_TYPES";
import ImageProcessor from "../utils/image/ImageProcessor";
import {v4} from "uuid";
import GBufferSystem from "./ecs/systems/GBufferSystem";
import SYSTEMS from "./templates/SYSTEMS";
import FramebufferInstance from "./instances/FramebufferInstance";
import {WebWorker} from "../../pages/project/utils/workers/WebWorker";

export default class Renderer {
    _currentFrame = 0
    rootCamera = new RootCamera()
    viewTarget = this.rootCamera


    constructor(gpu, resolutionScale = 1) {
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolutionScale)
        this.GBufferSystem = new GBufferSystem(gpu, resolutionScale)

        const brdf = new Image()
        console.log(brdfImg)
        brdf.src = brdfImg
        brdf.decode().then(async () => {
            console.log('EHTE')
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

            // console.log('TABOM1')
            // const w =new WebWorker()
            // const d = () => {
            //     self.addEventListener('message', (event) => {
            //         console.log('CAFE')
            //     })
            // }
            // w.createExecution('', d.toString())
            // const t = await ImageProcessor.colorToImage('rgba(128, 128, 128, 1)')
            // console.log('TABOM2', t)


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
                () => this._ready = true,
                v4())
            console.log('TABOM')
        })
        const a = new FramebufferInstance(gpu), b = new FramebufferInstance(gpu)
        a.texture().depthTest()
        b.texture()

        this.postProcessingFramebuffers = [a, b]
    }


    getLightsUniforms() {
        const {
            pointLights,
            directionalLights
        } = this.data

        let maxTextures = directionalLights.length > 2 ? 2 : directionalLights.length,
            pointLightsQuantity = (pointLights.length > 4 ? 4 : pointLights.length)

        let dirLights = [],
            dirLightsPov = [],
            lClip = [],
            lPosition = [],
            lColor = [],
            lAttenuation = []

        getArray(maxTextures, i => {
            const current = directionalLights[i]
            if (current && current.components[COMPONENTS.DIRECTIONAL_LIGHT]) {
                dirLights[i] = {
                    direction: current.components[COMPONENTS.DIRECTIONAL_LIGHT].direction,
                    ambient: current.components[COMPONENTS.DIRECTIONAL_LIGHT].fixedColor,
                    atlasFace: current.components[COMPONENTS.DIRECTIONAL_LIGHT].atlasFace
                }
                dirLightsPov[i] = {
                    lightViewMatrix: current.components[COMPONENTS.DIRECTIONAL_LIGHT].lightView,
                    lightProjectionMatrix: current.components[COMPONENTS.DIRECTIONAL_LIGHT].lightProjection
                }
            }
        })

        getArray(pointLightsQuantity, i => {
            const current = pointLights[i]
            if (current && current.components[COMPONENTS.POINT_LIGHT]) {
                lClip[i] = [current.components[COMPONENTS.POINT_LIGHT]?.zNear, current.components[COMPONENTS.POINT_LIGHT]?.zFar]

                lPosition[i] = current.components[COMPONENTS.TRANSFORM].position
                lColor[i] = current.components[COMPONENTS.POINT_LIGHT]?.fixedColor
                lAttenuation[i] = current.components[COMPONENTS.POINT_LIGHT]?.attenuation
            }
        })
        return {
            pointLightsQuantity,
            maxTextures,
            dirLights,
            dirLightsPov,
            lClip,
            lPosition,
            lColor,
            lAttenuation,
        }
    }

    callback(systems, onBeforeRender, onWrap) {
        onBeforeRender()
        const l = this.getLightsUniforms()
        const data = {...this.data, ...l}
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
                    data,
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
            data,
            this.filteredEntities,
            this.entitiesMap,
            onWrap,
            this.postProcessingFramebuffers)

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap));
    }

    start(s, entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {
        const systems = {...s, [SYSTEMS.MESH]: this.GBufferSystem}
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
            skylight: filteredEntities.filter(e => e.components[COMPONENTS.SKYLIGHT] && e.active)[0]?.components[COMPONENTS.SKYLIGHT],
            cubeMaps: filteredEntities.filter(e => e.components[COMPONENTS.CUBE_MAP]),
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

function getArray(size, onIndex) {
    for (let i = 0; i < size; i++) {
        onIndex(i)
    }

}