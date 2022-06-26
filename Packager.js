import COMPONENTS from "./templates/COMPONENTS"
import toObject from "./utils/toObject"
import Scripting from "./systems/misc/Scripting"
import {mat4} from "gl-matrix"

export default function Packager (
    {
        entities,
        materials,
        meshes,
        params,
        onWrap,
        fallbackMaterial,
        levelScript
    },
    renderer
) {

    const active = entities.filter(e => e.active)
    const attributes = {...params}
    const data = {
        cubeBuffer: renderer.cubeBuffer,
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
        levelScript: typeof levelScript === "string"? Scripting.parseScript(levelScript) : undefined
    }
    active.forEach(entity => {
        entity.scripts = (entity.scripts ? entity.scripts : []).map(s => {
            if(typeof s === "string")
                return Scripting.parseScript(s)
            return s
        })
    })


    data.cubeMapsSources = toObject(data.cubeMaps)
    attributes.camera = params.camera ? params.camera : renderer.rootCamera
    attributes.entitiesLength = active.length

    attributes.onWrap = onWrap ? onWrap : () => null
    attributes.brdf = renderer.brdf
    attributes.fallbackMaterial = fallbackMaterial




    renderer.data = {...data, ...lights(data.pointLights, data.directionalLights)}
    renderer.params = attributes
    renderer.entities = active
    renderer.then = performance.now()
    const bBox = window.gpu.canvas.getBoundingClientRect()
    if (renderer.params.camera) {
        renderer.params.camera.aspectRatio = bBox.width / bBox.height
        renderer.params.camera.updateProjection()
    }
}

function lights(pointLights, directionalLights) {
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
    
    return {
        pointLightsQuantity,
        pointLightData,
        maxTextures,
        directionalLightsData,
        dirLightPOV,
        lClip
    }
}

Packager.lights = lights