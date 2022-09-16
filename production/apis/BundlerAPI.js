import COMPONENTS from "../../static/COMPONENTS.json"
import {packageDirectionalLights, packagePointLights} from "../utils/package-lights";
import Engine from "../Engine";
import Component from "../components/Component";
import ConsoleAPI from "./ConsoleAPI";
import QueryAPI from "./utils/QueryAPI";
import InputEventsAPI from "./utils/InputEventsAPI";
import CameraAPI from "./camera/CameraAPI";
import SpecularProbePass from "../passes/rendering/SpecularProbePass";
import DiffuseProbePass from "../passes/rendering/DiffuseProbePass";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import PhysicsPass from "../passes/math/PhysicsPass";
import WorkerController from "../workers/WorkerController";

function toObject(classes) {
    const res = {}, s = classes.length
    for (let i = 0; i < s; i++)
        res[classes[i].id] = classes[i]

    return res
}

let lightTimeout
const STYLES = {
    position: "absolute",
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    height: "100%"
}

export default class BundlerAPI {
    static lightsChanged = []
    static uiMountingPoint
    static get uiMountingPoint() {
        return BundlerAPI.uiMountingPoint
    }

    static addEntity(entity) {
        Engine.entitiesMap.set(entity.id, entity)
        Engine.entities.push(entity)
        WorkerController.registerEntity(entity)
        BundlerAPI.registerEntityComponents(entity)
    }

    static registerEntityComponents(entity) {
        PhysicsPass.registerRigidBody(entity)
        const data = Engine.data
        Engine.queryMap.set(entity.queryKey, entity)


        let placementMap = Engine.dataEntity.get(entity.id) || {}
        if (Object.keys(placementMap).length > 0)
            Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))
        if (entity.components.get(COMPONENTS.POINT_LIGHT)) {
            data.pointLights.push(entity)
            placementMap.pointLights = true
        }
        if (entity.components.get(COMPONENTS.MESH)) {
            data.meshes.push(entity)
            placementMap.meshes = true
        }
        if (entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT)) {
            data.directionalLights.push(entity)
            placementMap.directionalLights = true
        }
        if (entity.components.get(COMPONENTS.PROBE) && entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.specularProbes.push(entity)
            placementMap.specularProbes = true
        }
        if (entity.components.get(COMPONENTS.CAMERA)) {
            data.cameras.push(entity)
            placementMap.cameras = true
        }
        if (entity.components.get(COMPONENTS.PROBE) && !entity.components.get(COMPONENTS.PROBE).specularProbe) {
            data.diffuseProbes.push(entity)
            placementMap.diffuseProbes = true
        }
        if (entity.components.get(COMPONENTS.SPRITE)) {
            data.sprites.push(entity)
            placementMap.sprites = true
        }
        if (BundlerAPI.uiMountingPoint != null)
            BundlerAPI.#createUIEntity(entity)

        Engine.dataEntity.set(entity.id, placementMap)
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            BundlerAPI.packageLights()
    }

    static removeEntity(id) {
        const entity = Engine.entitiesMap.get(id)
        if (!entity)
            return
        const placementMap = Engine.dataEntity.get(id)
        Object.keys(placementMap).forEach(k => Engine.data[k] = Engine.data[k].filter(e => e !== entity))

        Engine.entitiesMap.delete(id)
        Engine.entities = Engine.entities.filter(e => e.id !== id)

        PhysicsPass.removeRigidBody(entity)

        BundlerAPI.removeUnusedProbes()
        if (entity.components.get(COMPONENTS.POINT_LIGHT) != null || entity.components.get(COMPONENTS.DIRECTIONAL_LIGHT) != null)
            BundlerAPI.packageLights()

        WorkerController.removeEntity(entity)
        BundlerAPI.#deleteUIEntity(entity)
    }


    static removeUnusedProbes() {
        const data = Engine.data,
            entities = Engine.entities

        const sP = toObject(data.specularProbes), dP = toObject(data.diffuseProbes)
        const specularProbes = SpecularProbePass.specularProbes
        const diffuseProbes = DiffuseProbePass.diffuseProbes
        const s = SpecularProbePass.probes
        const d = DiffuseProbePass.probes

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

    static packageLights(keepOld, force) {
        if (force) {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
        }, 50)

    }

    static linkScript(data, entity, scriptID, src) {
        const found = entity.scripts.findIndex(s => s.id === scriptID)
        try {
            const generator = new Function("InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI", data.toString())
            try {

                const Instance = generator(InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI)
                const newClass = new Instance(entity)
                newClass.entity = entity

                if (found > -1) {
                    const ref = entity.scripts[found]
                    Object.entries(ref).forEach(([key, value]) => {
                        if (typeof value !== "function")
                            newClass[key] = value
                    })
                    entity.scripts[found] = newClass
                } else
                    entity.scripts.push(newClass)

                newClass.id = scriptID
                return true
            } catch (runtimeError) {
                console.error(runtimeError)
                ConsoleAPI.error(`${runtimeError.name}: ${runtimeError.message}. (${src})`)
                return false
            }
        } catch (syntaxError) {
            ConsoleAPI.error(`${syntaxError.name}: ${syntaxError.message}. (${src})`)
            console.error(syntaxError)
            return false
        }
    }


    static #deleteUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        if (!UI || !UI.__element)
            return
        const children = UI.__element.querySelectorAll("[data-enginewrapper='-']")
        children.forEach(c => {
            UI.__element.removeChild(c)
            BundlerAPI.uiMountingPoint.appendChild(c)
            UI.anchorElement = undefined
        })
    }

    static #createUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        if (!entity.active || !UI || Engine.queryMap.get(entity.queryKey) !== entity)
            return
        const el = document.createElement("div")
        Object.assign(el.style, UI.wrapperStyles)
        el.id = entity.queryKey
        el.innerHTML = UI.uiLayoutData

        el.setAttribute("data-enginewrapper", "-")
        el.setAttribute("data-engineentityid", entity.id)
        BundlerAPI.uiMountingPoint.appendChild(el)
        UI.__element = el

        return {parent: UI.anchorElement, element: el}
    }

    static buildUI(target) {
        console.trace(target)
        if (target != null)
            BundlerAPI.uiMountingPoint = target
        if (!BundlerAPI.uiMountingPoint) {
            const el = document.createElement("span")
            InputEventsAPI.targetElement.appendChild(el)
            BundlerAPI.uiMountingPoint = el
        }
        BundlerAPI.uiMountingPoint.style.display = "none"
        const elementsToBind = []
        const entities = Engine.entities
        for (let i = 0; i < entities.length; i++)
            elementsToBind.push(BundlerAPI.#createUIEntity(entities[i]))
        for (let i = 0; i < elementsToBind.length; i++) {
            if (!elementsToBind[i])
                continue
            const {parent, element} = elementsToBind[i]
            const parentElement = document.getElementById(parent)
            if (parentElement)
                parentElement.appendChild(element)
            else
                BundlerAPI.uiMountingPoint.appendChild(element)
        }

        Object.assign(BundlerAPI.uiMountingPoint.style, STYLES)
    }

    static updateUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        console.log(entity, UI)
        if (!entity.active || !UI || Engine.queryMap.get(entity.queryKey) !== entity || !UI.__element)
            return

        const el = UI.__element
        el.removeAttribute("style")
        Object.assign(el.style, UI.wrapperStyles)
        el.id = entity.queryKey
        el.innerHTML = UI.uiLayoutData
    }

    static destroyUI() {
        if (!BundlerAPI.uiMountingPoint)
            return

        BundlerAPI.uiMountingPoint.innerHTML = ""
        const entities = Engine.entities
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            const UI = entity.components.get(COMPONENTS.UI)
            if (!entity.active || !UI || Engine.queryMap.get(entity.queryKey) !== entity)
                continue
            UI.__element = undefined
        }
    }

}
