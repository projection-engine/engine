import Engine from "../Engine";
import UserInterfaceController from "../controllers/UserInterfaceController";

export default class QueryAPI {
    static getEntityByQueryID(id) {
        return Engine.queryMap.get(id)
    }

    static getEntityByID(id) {
        return Engine.entitiesMap.get(id)
    }

    static getEntitiesWithNativeComponent(componentKey) {
        const newArr = []
        Engine.entitiesMap.forEach(entity => {
            if (entity.components[componentKey] != null)
                newArr.push(entity)
        })
        return newArr
    }

    static getUIElementByQueryID(id) {
        const arr = Array.from(UserInterfaceController.entities.values())
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].queryKey === id)
                return arr[i]
        }
        return undefined
    }

    static loadFile(absoluteName) {
        // TODO - IMPLEMENT LOADING API FOR WEB AND NATIVE
    }
}