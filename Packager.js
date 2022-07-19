import COMPONENTS from "./data/COMPONENTS"
import toObject from "./utils/toObject"
import Scripting from "./systems/misc/Scripting"
import {mat4} from "gl-matrix"

export default function Packager({
    params,
    onWrap,
    fallbackMaterial,
    levelScript
}) {

    const renderer = window.renderer,
        materials = renderer.materials
    const entities = Array.from(renderer.entitiesMap.values())
    const materialsWithFallback = [...materials, fallbackMaterial]
    const attributes = {...params}
    const data = {
        cubeBuffer: renderer.cubeBuffer,
        pointLights: [],
        meshes: [],
        directionalLights: [],
        specularProbes: [],
        cameras: [],
        diffuseProbes: [],

        materials: toObject(materialsWithFallback),
        materialEntityMap: getMaterialEntityMap(entities, materialsWithFallback),
        meshesMap: renderer.meshes,
        entitiesMap: renderer.entitiesMap,
        levelScript: typeof levelScript === "string" ? Scripting.parseScript(levelScript) : undefined,
    }
    let activeEntitiesSize = 0
    for(let i = 0; i < entities.length; i++){
        const entity = entities[i]
        if(entity.active)
            activeEntitiesSize++
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
    renderer.activeEntitiesSize = activeEntitiesSize
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
        pointLightData = [],
        activeOffset = 0

    if(directionalLights)
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i]
            if(!current.active) {
                activeOffset++
                continue
            }
            maxTextures++
            const component = current.components[COMPONENTS.DIRECTIONAL_LIGHT]

            if(!directionalLightsData[i - activeOffset])
                directionalLightsData[i - activeOffset] = new Float32Array(9)
            const currentVector = directionalLightsData[i - activeOffset]
            const position = current.components[COMPONENTS.TRANSFORM].translation
            currentVector[0] = position[0]
            currentVector[1] = position[1]
            currentVector[2] = position[2]

            const color = component.fixedColor
            currentVector[3] = color[0]
            currentVector[4] = color[1]
            currentVector[5] = color[2]
 
            currentVector[6] = component.atlasFace[0]
            currentVector[7] = component.atlasFace[1]
            currentVector[8] = component.shadowMap ? 1 : 0
            if(!dirLightPOV[i - activeOffset])
                dirLightPOV[i - activeOffset] = new Float32Array(16)
            mat4.multiply(dirLightPOV[i - activeOffset], component.lightProjection, component.lightView)
        }
    activeOffset = 0
    if(pointLights)
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i]
            if(!current.active) {
                activeOffset++
                continue
            }
            pointLightsQuantity++
            const component = current.components[COMPONENTS.POINT_LIGHT]

            if(!pointLightData[i - activeOffset])
                pointLightData[i - activeOffset] = new Float32Array(16)
            const currentVector = pointLightData[i - activeOffset]
            const position = current.components[COMPONENTS.TRANSFORM].position
            currentVector[0] = position[0]
            currentVector[1] = position[1]
            currentVector[2] = position[2]

            const color = component.fixedColor
            currentVector[4] = color[0]
            currentVector[5] = color[1]
            currentVector[6] = color[2]

            const attenuation = component.attenuation
            currentVector[8] = attenuation[0]
            currentVector[9] = attenuation[1]
            currentVector[10] = attenuation[2]

            currentVector[11] = component.zFar
            currentVector[12] = component.zNear
            currentVector[13] = component.shadowMap ? 1 : 0
        }
    window.renderer.data.pointLightsQuantity = pointLightsQuantity
    window.renderer.data.pointLightData = pointLightData
    window.renderer.data.maxTextures = maxTextures
    window.renderer.data.directionalLightsData = directionalLightsData
    window.renderer.data.dirLightPOV = dirLightPOV
}

Packager.lights = lights