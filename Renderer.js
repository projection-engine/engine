import cloneClass from "./utils/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import toObject from "./utils/toObject";
import RootCamera from "./RootCamera";
import RenderingWrapper from "./ecs/systems/RenderingWrapper";
import brdfImg from "./utils/brdf_lut.jpg";
import {createTexture, lookAt} from "./utils/utils";
import MaterialInstance from "./instances/MaterialInstance";
import * as shaderCode from "./shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "../views/blueprints/components/DATA_TYPES";
import ImageProcessor from "./utils/image/ImageProcessor";
import {v4} from "uuid";
import GBufferSystem from "./ecs/systems/GBufferSystem";
import SYSTEMS from "./templates/SYSTEMS";
import FramebufferInstance from "./instances/FramebufferInstance";
import CubeMapInstance from "./instances/CubeMapInstance";
import Shader from "./utils/Shader";
import * as shaderCodeSkybox from "./shaders/misc/cubeMap.glsl";
import * as skyboxCode from "./shaders/misc/skybox.glsl";
import ScriptSystem from "./ecs/systems/ScriptSystem";

export default class Renderer {
    _currentFrame = 0
    rootCamera = new RootCamera()
    viewTarget = this.rootCamera


    constructor(gpu, resolutionScale = 1) {
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolutionScale)
        this.GBufferSystem = new GBufferSystem(gpu, resolutionScale)

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
                shaderCode.vertex,
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
                        fallbackMaterial: this.fallbackMaterial,
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
            scripts: toObject(this.parseScripts(scripts)),
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

        // SKYBOX COMPILATION
        const skyboxElement = this.data.skybox
        if (skyboxElement && !skyboxElement.ready) {
            const shader = new Shader(shaderCodeSkybox.vertex, skyboxCode.generationFragment, this.gpu)
            if (!skyboxElement.cubeMap)
                skyboxElement.cubeMap = new CubeMapInstance(this.gpu, skyboxElement.resolution, false)
            if (skyboxElement.blob) {
                skyboxElement.texture = createTexture(
                    this.gpu,
                    skyboxElement.blob.width,
                    skyboxElement.blob.height,
                    this.gpu.RGB16F,
                    0,
                    this.gpu.RGB,
                    this.gpu.FLOAT,
                    skyboxElement.blob,
                    this.gpu.LINEAR,
                    this.gpu.LINEAR,
                    this.gpu.CLAMP_TO_EDGE,
                    this.gpu.CLAMP_TO_EDGE
                )

                shader.use()
                skyboxElement.cubeMap.resolution = skyboxElement.resolution
                skyboxElement.cubeMap.draw((yaw, pitch, perspective) => {
                    shader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                        uSampler: skyboxElement.texture
                    })
                    this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
                }, true)

                skyboxElement.cubeMap.generateIrradiance()
                skyboxElement.cubeMap.generatePrefiltered(skyboxElement.prefilteredMipmaps, skyboxElement.resolution / skyboxElement.prefilteredMipmaps)
                skyboxElement.ready = true
            }
            this.gpu.deleteProgram(shader.program)
        }
        // SKYBOX COMPILATION

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap))
    }

    parseScripts(scripts) {
        return scripts.map(s => {
            try {

                return {
                    id: s.id,
                    executor: ScriptSystem.parseScript(s.executors)
                }
            } catch (e) {
                console.log(e)
                return undefined
            }
        }).filter(e => e !== undefined)
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
