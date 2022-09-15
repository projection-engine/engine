import Engine from "../../Engine";
import UIAPI from "./UIAPI";

export default class QueryAPI {
    static getEntityByQueryID(id) {
        return Engine.queryMap.get(id)
    }

    static getEntityByID(id) {
        return Engine.entitiesMap.get(id)
    }

    static getEntitiesWithNativeComponent(componentKey) {
        const newArr = []
        for (let i = 0; i < Engine.entities.length; i++) {
            const entity = Engine.entities[i]
            if (entity.components.get(componentKey) != null)
                newArr.push(entity)
        }


        return newArr
    }

    static getUIElementByQueryID(id) {
        const arr = Array.from(UIAPI.entities.values())
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].queryKey === id)
                return arr[i]
        }
        return undefined
    }

    static getEntityByPickerID(id) {
        if (id === 0)
            return

        const entities = Engine.entities
        return entities.find(e => e?.pickIndex === id)
    }

    static loadFile(absoluteName) {
        // TODO - IMPLEMENT LOADING API FOR WEB AND NATIVE
    }
}