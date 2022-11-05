import GPU from "../GPU";
import GPUAPI from "./GPUAPI";
import PhysicsAPI from "./PhysicsAPI";
import UIAPI from "./UIAPI";
import TransformationAPI from "./math/TransformationAPI";
import InputEventsAPI from "./utils/InputEventsAPI";
import ConsoleAPI from "./ConsoleAPI";
import Component from "../templates/components/Component";
import COMPONENTS from "../static/COMPONENTS";
import CameraAPI from "./CameraAPI";
import QueryAPI from "./utils/QueryAPI";
import FileSystemAPI from "./FileSystemAPI";
import EntityAPI from "./EntityAPI";
import Engine from "../Engine";

export default class ScriptsAPI {
    static scriptInstances = new Map()
    static mountedScripts = []
    static mountedScriptsMap = new Map()

    static async updateAllScripts() {
        ScriptsAPI.mountedScripts = []
        ScriptsAPI.mountedScriptsMap.clear()
        const scriptsToUpdate = Array.from(ScriptsAPI.scriptInstances.keys())
        for (let i = 0; i < scriptsToUpdate.length; i++) {
            const current = scriptsToUpdate[i]
            const data = await FileSystemAPI.readAsset(current)
            ScriptsAPI.scriptInstances.set(current, data)
        }

        for (let i = 0; i < Engine.entities.length; i++) {
            const current = Engine.entities[i]
            for (let j = 0; j < current.scripts.length; j++)
                ScriptsAPI.#updateEntityScript(current.scripts[j].id, current, j)
        }

    }

    static async linkScript(entity, scriptID) {
        let scriptFound = ScriptsAPI.scriptInstances.get(scriptID)
        const found = entity.scripts.findIndex(s => s.id === scriptID)
        if (!scriptFound) {
            const data = await FileSystemAPI.readAsset(scriptID)
            if (data != null)
                ScriptsAPI.scriptInstances.set(scriptID, data)
            else if (found > -1) {
                entity.scripts.splice(found, 1)
                return
            }
        }
        ScriptsAPI.#updateEntityScript(scriptID, entity, found)
    }

    static parseScript(data){
        try {
            const generator = new Function("GPU, GPUAPI, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI, entity, FileSystemAPI", data)
            try {
                return generator(GPU, GPUAPI, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI, null, FileSystemAPI)
            } catch (runtimeError) {
                ConsoleAPI.error(runtimeError)
            }
        } catch (syntaxError) {
            ConsoleAPI.error(syntaxError)
        }
    }
    static #updateEntityScript(scriptID, entity, index) {
        const scriptData = ScriptsAPI.scriptInstances.get(scriptID)
        if (!scriptData)
            return
        try {
            const generator = new Function("GPU, GPUAPI, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI, entity, FileSystemAPI", scriptData)
            try {
                const script = generator(GPU, GPUAPI, PhysicsAPI, UIAPI, TransformationAPI, EntityAPI, InputEventsAPI, ConsoleAPI, Component, COMPONENTS, CameraAPI, QueryAPI, entity, FileSystemAPI)
                if (index > -1) {
                    const ref = entity.scripts[index]
                    Object.entries(ref).forEach(([key, value]) => {
                        if (typeof value !== "function" && key !== "_props" && key !== "_name")
                            script[key] = value
                    })
                    entity.scripts[index] = script
                } else
                    entity.scripts.push(script)
                script.id = scriptID

                if (!Engine.isDev && script.onCreation)
                    script.onCreation()
                const oldIndex = ScriptsAPI.mountedScriptsMap.get(scriptID)
                if (oldIndex !== undefined)
                    ScriptsAPI.mountedScripts[oldIndex] = script
                else {
                    ScriptsAPI.mountedScripts.push(script)
                    ScriptsAPI.mountedScriptsMap.set(scriptID, ScriptsAPI.mountedScripts.length - 1)
                }
                return true
            } catch (runtimeError) {
                ConsoleAPI.error(runtimeError)
            }
        } catch (syntaxError) {
            ConsoleAPI.error(syntaxError)
        }
    }
}