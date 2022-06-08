import COMPONENTS from "./templates/COMPONENTS"
import ShaderInstance from "./instances/ShaderInstance"
import * as shaderCodeSkybox from "./shaders/CUBE_MAP.glsl"
import * as skyboxCode from "./shaders/SKYBOX.glsl"
import CubeMapInstance from "./instances/CubeMapInstance"
import {createTexture, lookAt} from "./utils/utils"
import cloneClass from "./utils/cloneClass"
import toObject from "./utils/toObject"
import ScriptSystem from "./systems/ScriptSystem"
import RootCameraInstance from "./instances/RootCameraInstance"
import {mat4} from "gl-matrix"

export default class RenderingPackager {
    rootCamera = new RootCameraInstance()

    constructor(gpu) {
        this.skyShader = new ShaderInstance(shaderCodeSkybox.vertex, skyboxCode.generationFragment, gpu)
    }

    makePackage({
        entities,
        materials,
        meshes,
        params,
        scripts = [],
        onWrap,
        gpu,
        brdf,
        fallbackMaterial,
        cubeBuffer
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
            lines: filteredEntities.filter(e => e.components[COMPONENTS.LINE]),
            scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            scripts: toObject(RenderingPackager.parseScripts(scripts)),
            entitiesMap: toObject(entities),
            lightProbes: filteredEntities.filter(e => e.components[COMPONENTS.PROBE])
        }

        RenderingPackager.loadSkybox(data.skybox, gpu, cubeBuffer, this.skyShader)

        data.cubeMapsSources = toObject(data.cubeMaps)
        attributes.camera = params.camera ? params.camera : this.rootCamera
        attributes.entitiesLength = filteredEntities.length

        attributes.onWrap = onWrap ? onWrap : () => null
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
        let maxTextures = directionalLights.length,
            pointLightsQuantity = pointLights.length

        let directionalLightsData = [],
            dirLightPOV = [],
            lClip = [],
            pointLightData = []

        RenderingPackager.#getArray(maxTextures, i => {
            const current = directionalLights[i]
            if (current && current.components[COMPONENTS.DIRECTIONAL_LIGHT]) {
                const l = current.components[COMPONENTS.DIRECTIONAL_LIGHT]
                directionalLightsData[i] = [
                    l.direction,
                    l.fixedColor,
                    [...l.atlasFace, l.shadowMap ? 1 : 0]
                ].flat()

                dirLightPOV[i] = mat4.multiply([], l.lightProjection, l.lightView)
            }
        })

        RenderingPackager.#getArray(pointLightsQuantity, i => {
            const component = pointLights[i] ? pointLights[i].components : undefined
            if (component) {
                lClip[i] = [component[COMPONENTS.POINT_LIGHT].zNear, component[COMPONENTS.POINT_LIGHT]?.zFar]
                pointLightData[i] = [
                    [...component[COMPONENTS.TRANSFORM].position, 0],
                    [...component[COMPONENTS.POINT_LIGHT].fixedColor, 0],
                    [...component[COMPONENTS.POINT_LIGHT].attenuation, 0],
                    [component[COMPONENTS.POINT_LIGHT].zFar, component[COMPONENTS.POINT_LIGHT].zNear, component[COMPONENTS.POINT_LIGHT].shadowMap ? 1 : 0, 0]
                ].flat()
            }
        })
        return {
            pointLightsQuantity,
            pointLightData,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            lClip
        }
    }

    static loadSkybox(skyboxElement, gpu, cubeBuffer, skyShader) {
        gpu.bindVertexArray(null)
        const noTexture = !(skyboxElement?.texture instanceof WebGLTexture)
        if (skyboxElement && !skyboxElement.ready) {
            if (!skyboxElement.cubeMap)
                skyboxElement.cubeMap = new CubeMapInstance(gpu, skyboxElement.resolution, false)
            if (noTexture || skyboxElement.blob) {
                if (!noTexture)
                    gpu.deleteTexture(skyboxElement.texture)
                skyboxElement.texture = createTexture(
                    gpu,
                    skyboxElement.blob?.width,
                    skyboxElement.blob?.height,
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
                skyboxElement.blob = null
            }
            if(skyboxElement.texture instanceof WebGLTexture) {
                skyShader.use()
                skyboxElement.cubeMap.resolution = skyboxElement.resolution
                skyboxElement.cubeMap.draw((yaw, pitch, perspective) => {
                    skyShader.use()
                    skyShader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                        uSampler: skyboxElement.texture
                    })
                    gpu.drawArrays(gpu.TRIANGLES, 0, 36)
                }, cubeBuffer)

                skyboxElement.cubeMap.generateIrradiance(cubeBuffer)
                skyboxElement.cubeMap.generatePrefiltered(skyboxElement.prefilteredMipmaps + 1, skyboxElement.resolution / skyboxElement.prefilteredMipmaps, cubeBuffer)

                skyboxElement.ready = true
            }
        }
    }

}