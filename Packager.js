import COMPONENTS from "./templates/COMPONENTS"
import toObject from "./utils/toObject"
import ScriptSystem from "./systems/ScriptSystem"
import RootCameraInstance from "./instances/RootCameraInstance"
import {mat4} from "gl-matrix"

export default class Packager {
    rootCamera = new RootCameraInstance()
    makePackage({
        entities,
        materials,
        meshes,
        params,
        onWrap,

        brdf,
        fallbackMaterial,
        levelScript
    }) {
        const active = entities.filter(e => e.active)
        const attributes = {...params}
        const data = {
            pointLights: active.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
            spotLights: active.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
            meshes: active.filter(e => e.components[COMPONENTS.MESH]),
            directionalLights: active.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
            cubeMaps: active.filter(e => e.components[COMPONENTS.CUBE_MAP]),
            cameras: active.filter(e => e.components[COMPONENTS.CAMERA]),
            lines: active.filter(e => e.components[COMPONENTS.LINE]),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            entitiesMap: toObject(entities),
            lightProbes: active.filter(e => e.components[COMPONENTS.PROBE]),
            levelScript: typeof levelScript === "string"? ScriptSystem.parseScript(levelScript) : undefined
        }
        active.forEach(entity => {
            entity.scripts = (entity.scripts ? entity.scripts : []).map(s => {
                if(typeof s === "string")
                    return ScriptSystem.parseScript(s)
                return s
            })
        })


        data.cubeMapsSources = toObject(data.cubeMaps)
        attributes.camera = params.camera ? params.camera : this.rootCamera
        attributes.entitiesLength = active.length

        attributes.onWrap = onWrap ? onWrap : () => null
        attributes.brdf = brdf
        attributes.fallbackMaterial = fallbackMaterial

        return {
            data: {...data, ...this.getLightsUniforms(data.pointLights, data.directionalLights)},
            attributes,
            filteredEntities: active
        }
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

        Packager.#getArray(maxTextures, i => {
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

        Packager.#getArray(pointLightsQuantity, i => {
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
}