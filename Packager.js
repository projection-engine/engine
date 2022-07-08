import COMPONENTS from "./templates/COMPONENTS"
import toObject from "./utils/toObject"
import Scripting from "./systems/misc/Scripting"
import {mat4} from "gl-matrix"

export default function Packager({
        params,
        onWrap,
        fallbackMaterial,
        levelScript
    }) {

    const renderer = window.renderer
    const meshes = renderer.meshes,
        materials = renderer.materials
    const entities = Array.from(renderer.entitiesMap.values())
    const materialsWithFallback = [...materials, fallbackMaterial]
    const active = entities.filter(e => e.active)
    const attributes = {...params}
    const data = {
        cubeBuffer: renderer.cubeBuffer,
        pointLights: active.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
        // spotLights: active.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
        meshes: active.filter(e => e.components[COMPONENTS.MESH]),
        directionalLights: active.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
        specularProbes: active.filter(e => e.components[COMPONENTS.PROBE] && e.components[COMPONENTS.PROBE].specularProbe),
        cameras: active.filter(e => e.components[COMPONENTS.CAMERA]),
        // lines: active.filter(e => e.components[COMPONENTS.LINE]),
        materials: toObject(materialsWithFallback),
        materialEntityMap: getMaterialEntityMap(active, materialsWithFallback),
        meshesMap: toObject(meshes),
        entitiesMap: toObject(active),
        diffuseProbes: active.filter(e => e.components[COMPONENTS.PROBE] && !e.components[COMPONENTS.PROBE].specularProbe),
        levelScript: typeof levelScript === "string" ? Scripting.parseScript(levelScript) : undefined,
    }

    active.forEach(entity => {
        entity.scripts = (entity.scripts ? entity.scripts : []).map(s => {
            if (typeof s === "string")
                return Scripting.parseScript(s)
            return s
        })
    })

    cleanUpProbes(data, renderer, entities)

    attributes.camera = params.camera ? params.camera : renderer.rootCamera
    attributes.entitiesLength = active.length
    attributes.onWrap = onWrap ? onWrap : () => null
    attributes.brdf = renderer.brdf
    renderer.params = attributes
    renderer.entities = active
    renderer.allEntities = entities
    renderer.then = performance.now()

    lights(data)
    renderer.data = data
}

function getMaterialEntityMap(entities, materials) {
    const result = []
    for (let i in materials) {
        const current = []
        for (let j in entities) {
            if (entities[j].materialUsed === materials[i].id)
                current.push(entities[j])
        }
        result.push(current)
    }
    return result
}

function cleanUpProbes(data, renderer, entities) {
    const sP = toObject(data.specularProbes), dP = toObject(data.diffuseProbes)
    const specularProbes = renderer.renderingPass.specularProbe.specularProbes
    const diffuseProbes = renderer.renderingPass.diffuseProbe.specularProbes
    const s = renderer.renderingPass.specularProbe.probes
    const d = renderer.renderingPass.diffuseProbe.probes

    Object.keys(specularProbes).forEach(k => {
        if (!sP[k]) {
            const entity = entities.find(e => e.id === k)
            if (!entity) {
                specularProbes[k].delete()
                delete specularProbes[k]
            }
            delete s[k]
        }
    })
    Object.keys(diffuseProbes).forEach(k => {
        if (!dP[k]) {
            const entity = entities.find(e => e.id === k)
            if (!entity) {
                diffuseProbes[k].delete()
                delete diffuseProbes[k]
            }
            delete d[k]
        }
    })
}

function lights(data) {
    const pointLights = data.pointLights, directionalLights = data.directionalLights
    let maxTextures = directionalLights.length,
        pointLightsQuantity = pointLights.length,
        directionalLightsData = [],
        dirLightPOV = [],
        lClip = [],
        pointLightData = []

    for (let i = 0; i < maxTextures; i++) {
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
    }

    for (let i = 0; i < pointLightsQuantity; i++) {
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
    }


    data.pointLightsQuantity = pointLightsQuantity
    data.pointLightData = pointLightData
    data.maxTextures = maxTextures
    data.directionalLightsData = directionalLightsData
    data.dirLightPOV = dirLightPOV
    data.lClip = lClip
}

Packager.lights = lights