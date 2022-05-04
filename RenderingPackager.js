import COMPONENTS from "./templates/COMPONENTS";
import Shader from "./utils/Shader";
import * as shaderCodeSkybox from "./shaders/misc/cubeMap.glsl";
import * as skyboxCode from "./shaders/misc/skybox.glsl";
import CubeMapInstance from "./instances/CubeMapInstance";
import {createTexture, lookAt} from "./utils/utils";
import cloneClass from "./utils/cloneClass";
import toObject from "./utils/toObject";
import ScriptSystem from "./systems/ScriptSystem";
import RootCameraInstance from "./instances/RootCameraInstance";

export default class RenderingPackager {
    rootCamera = new RootCameraInstance()

    makePackage({
                    entities,
                    materials,
                    meshes,
                    params,
                    scripts = [],
                    onBeforeRender,
                    onWrap,
                    gpu,
                    brdf,
                    fallbackMaterial
                }) {
        const filteredEntities = (params.canExecutePhysicsAnimation ? entities.map(e => cloneClass(e)) : entities).filter(e => e.active)
        const attributes = {...params}
        const data = {
            pointLights: filteredEntities.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
            spotLights: filteredEntities.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
            terrains: filteredEntities.filter(e => e.components[COMPONENTS.TERRAIN]),
            meshes: filteredEntities.filter(e => e.components[COMPONENTS.MESH]),
            skybox: filteredEntities.filter(e => e.components[COMPONENTS.SKYBOX] && e.active)[0]?.components[COMPONENTS.SKYBOX],
            directionalLights: filteredEntities.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
            skylight: filteredEntities.filter(e => e.components[COMPONENTS.SKYLIGHT] && e.active)[0]?.components[COMPONENTS.SKYLIGHT],
            cubeMaps: filteredEntities.filter(e => e.components[COMPONENTS.CUBE_MAP]),
            cameras: filteredEntities.filter(e => e.components[COMPONENTS.CAMERA]),

            scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            scripts: toObject(RenderingPackager.parseScripts(scripts)),
            entitiesMap: toObject(entities),
        }

        this.#loadSkybox(data.skybox, gpu)

        data.cubeMapsSources = toObject(data.cubeMaps)
        attributes.camera = params.camera ? params.camera : this.rootCamera
        attributes.entitiesLength = filteredEntities.length

        attributes.onWrap = onWrap ? onWrap : () => null
        attributes.onBeforeRender = onBeforeRender ? onBeforeRender : () => null
        attributes.brdf = brdf
        attributes.fallbackMaterial = fallbackMaterial

        return {
            data: {...data, ...this.#getLightsUniforms(data.pointLights, data.directionalLights)},
            attributes,
            filteredEntities
        }
    }

    static parseScripts(scripts) {
        return scripts.map(s => {
            try {
                return {
                    id: s.id,
                    executor: ScriptSystem.parseScript(s.executors)
                }
            } catch (e) {
                return undefined
            }
        }).filter(e => e !== undefined)
    }

    static #getArray(size, onIndex) {
        for (let i = 0; i < size; i++) {
            onIndex(i)
        }
    }

    #getLightsUniforms(pointLights, directionalLights) {
        let maxTextures = directionalLights.length > 2 ? 2 : directionalLights.length,
            pointLightsQuantity = (pointLights.length > 4 ? 4 : pointLights.length)

        let dirLights = [],
            dirLightsPov = [],
            lClip = [],
            lPosition = [],
            lColor = [],
            lAttenuation = []

        RenderingPackager.#getArray(maxTextures, i => {
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

        RenderingPackager.#getArray(pointLightsQuantity, i => {
            const current = pointLights[i]
            if (current && current.components[COMPONENTS.POINT_LIGHT]) {
                lClip[i] = [current.components[COMPONENTS.POINT_LIGHT]?.zNear, current.components[COMPONENTS.POINT_LIGHT]?.zFar]

                lPosition[i] = [...current.components[COMPONENTS.TRANSFORM].position, current.components[COMPONENTS.POINT_LIGHT].shadowMap ? 1 : 0]
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

    #loadSkybox(skyboxElement, gpu) {
        if (skyboxElement && !skyboxElement.ready) {
            const shader = new Shader(shaderCodeSkybox.vertex, skyboxCode.generationFragment, gpu)
            if (!skyboxElement.cubeMap)
                skyboxElement.cubeMap = new CubeMapInstance(gpu, skyboxElement.resolution, false)
            if (skyboxElement.blob) {
                skyboxElement.texture = createTexture(
                    gpu,
                    skyboxElement.blob.width,
                    skyboxElement.blob.height,
                    gpu.RGB16F,
                    0,
                    gpu.RGB,
                    gpu.FLOAT,
                    skyboxElement.blob,
                    gpu.LINEAR,
                    gpu.LINEAR,
                    gpu.CLAMP_TO_EDGE,
                    gpu.CLAMP_TO_EDGE
                )

                shader.use()
                skyboxElement.cubeMap.resolution = skyboxElement.resolution
                skyboxElement.cubeMap.draw((yaw, pitch, perspective) => {
                    shader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                        uSampler: skyboxElement.texture
                    })
                    gpu.drawArrays(gpu.TRIANGLES, 0, 36)
                }, true)

                skyboxElement.cubeMap.generateIrradiance()
                skyboxElement.cubeMap.generatePrefiltered(skyboxElement.prefilteredMipmaps, skyboxElement.resolution / skyboxElement.prefilteredMipmaps)
                skyboxElement.ready = true
            }
            gpu.deleteProgram(shader.program)
        }
    }
}