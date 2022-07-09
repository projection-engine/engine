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
    const attributes = {...params}
    const data = {
        cubeBuffer: renderer.cubeBuffer,
        
        // spotLights: entities.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
        pointLights: [],
        meshes: [],
        directionalLights: [],
        specularProbes: [],
        cameras: [],
        diffuseProbes: [],
        // lines: entities.filter(e => e.components[COMPONENTS.LINE]),
        materials: toObject(materialsWithFallback),
        materialEntityMap: getMaterialEntityMap(entities, materialsWithFallback),
        meshesMap: toObject(meshes),
        entitiesMap: renderer.entitiesMap,
        
        levelScript: typeof levelScript === "string" ? Scripting.parseScript(levelScript) : undefined,
    }

    for(let i = 0; i < entities.length; i++){
        const entity = entities[i]
        entity.scripts = (entity.scripts ? entity.scripts : []).map(s => {
            if (typeof s === "string")
                return Scripting.parseScript(s)
            return s
        })

        if(entity.components[COMPONENTS.POINT_LIGHT])
            data.pointLights.push(entity)
        if (entity.components[COMPONENTS.MESH])
            data.meshes.push(entity)
        if(entity.components[COMPONENTS.DIRECTIONAL_LIGHT])
            data.directionalLights.push(entity)
        if(entity.components[COMPONENTS.PROBE] && entity.components[COMPONENTS.PROBE].specularProbe)
            data.specularProbes.push(entity)
        if(entity.components[COMPONENTS.CAMERA])
            data.cameras.push(entity)
        if(entity.components[COMPONENTS.PROBE] && !entity.components[COMPONENTS.PROBE].specularProbe)
            data.diffuseProbes.push(entity)
    }

    cleanUpProbes(data, renderer, entities)

    attributes.camera = params.camera ? params.camera : renderer.rootCamera
    attributes.onWrap = onWrap ? onWrap : () => null
    attributes.brdf = renderer.brdf
    renderer.params = attributes
    renderer.entities = entities
    renderer.then = performance.now()
    renderer.data = data
    lights()
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

function lights() {
    const pointLights = window.renderer.data.pointLights, directionalLights = window.renderer.data.directionalLights
    let maxTextures = 0,
        pointLightsQuantity = 0,
        directionalLightsData = [],
        dirLightPOV = [],
        lClip = [],
        pointLightData = []

    if(directionalLights)
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i]
            if(!current.active)
                continue
            maxTextures++
            const l = current.components[COMPONENTS.DIRECTIONAL_LIGHT]
            directionalLightsData[i] = [
                l.direction,
                l.fixedColor,
                [...l.atlasFace, l.shadowMap ? 1 : 0]
            ].flat()
            dirLightPOV[i] = mat4.multiply([], l.lightProjection, l.lightView)
        }
    if(pointLights)
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i]
            if(!current.active)
                continue
            pointLightsQuantity++
            const component = current ? current.components : undefined
            lClip[i] = [component[COMPONENTS.POINT_LIGHT].zNear, component[COMPONENTS.POINT_LIGHT]?.zFar]
            pointLightData[i] = [
                [...component[COMPONENTS.TRANSFORM].position, 0],
                [...component[COMPONENTS.POINT_LIGHT].fixedColor, 0],
                [...component[COMPONENTS.POINT_LIGHT].attenuation, 0],
                [component[COMPONENTS.POINT_LIGHT].zFar, component[COMPONENTS.POINT_LIGHT].zNear, component[COMPONENTS.POINT_LIGHT].shadowMap ? 1 : 0, 0]
            ].flat()
        }

    window.renderer.data.pointLightsQuantity = pointLightsQuantity
    window.renderer.data.pointLightData = pointLightData
    window.renderer.data.maxTextures = maxTextures
    window.renderer.data.directionalLightsData = directionalLightsData
    window.renderer.data.dirLightPOV = dirLightPOV
    window.renderer.data.lClip = lClip
}

Packager.lights = lights