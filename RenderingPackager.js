import COMPONENTS from "./templates/COMPONENTS";
import ShaderInstance from "./instances/ShaderInstance";
import * as shaderCodeSkybox from "./shaders/misc/cubeMap.glsl";
import * as skyboxCode from "./shaders/misc/skybox.glsl";
import CubeMapInstance from "./instances/CubeMapInstance";
import {createTexture, lookAt} from "./utils/utils";
import cloneClass from "./utils/cloneClass";
import toObject from "./utils/toObject";
import ScriptSystem from "./systems/ScriptSystem";
import RootCameraInstance from "./instances/RootCameraInstance";
import {mat4} from "gl-matrix";

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
            data: {...data, ...this.getLightsUniforms(data.pointLights, data.directionalLights)},
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

    getLightsUniforms(pointLights, directionalLights) {
        let maxTextures =  directionalLights.length,
            pointLightsQuantity = pointLights.length

        let dirLights = [],
            dirLightPOV = [],
            lClip = [],
            pointLightData = []

        RenderingPackager.#getArray(maxTextures, i => {
            const current = directionalLights[i]
            if (current && current.components[COMPONENTS.DIRECTIONAL_LIGHT]) {
                const l = current.components[COMPONENTS.DIRECTIONAL_LIGHT]
                dirLights[i] = {
                    direction: l.direction,
                    ambient: l.fixedColor,
                    atlasFace: l.atlasFace
                }

                dirLightPOV[i] = mat4.multiply([], l.lightProjection, l.lightView)
            }
        })

        RenderingPackager.#getArray(pointLightsQuantity, i => {
            const current = pointLights[i]
            if (current && current.components[COMPONENTS.POINT_LIGHT]) {
                lClip[i] = [current.components[COMPONENTS.POINT_LIGHT]?.zNear, current.components[COMPONENTS.POINT_LIGHT]?.zFar]
                // ,
                // [
                //    POSITION [0][0] [0][1] [0][2] EMPTY
                //    COLOR [1][0] [1][1] [1][2]  EMPTY
                //    ATTENUATION [2][0] [2][1] [2][2] EMPTY
                //    zFar [3][0] zNear [3][1] hasShadowMap [3][2] EMPTY
                // ] = mat4

                pointLightData[i] = [
                    [...current.components[COMPONENTS.TRANSFORM].position, 0],
                    [...current.components[COMPONENTS.POINT_LIGHT]?.fixedColor, 0],
                    [...current.components[COMPONENTS.POINT_LIGHT]?.attenuation, 0],
                    [current.components[COMPONENTS.POINT_LIGHT].zFar, current.components[COMPONENTS.POINT_LIGHT].zNear, current.components[COMPONENTS.POINT_LIGHT].shadowMap ? 1 : 0, 0]
                ].flat()
            }
        })
        return {
            pointLightsQuantity,
            maxTextures,
            dirLights,
            dirLightPOV,
            lClip,
            pointLightData
        }
    }

    #loadSkybox(skyboxElement, gpu) {
        if (skyboxElement && !skyboxElement.ready) {
            const shader = new ShaderInstance(shaderCodeSkybox.vertex, skyboxCode.generationFragment, gpu)
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