import Renderer from "../Renderer";

export default class QueryAPI {
    static getEntityByQueryID(id){
        return Renderer.queryMap.get(id)
    }
    static getEntityByID(id){
        return Renderer.entitiesMap.get(id)
    }
    static getEntitiesWithNativeComponent(componentKey){
        const newArr = []
        Renderer.entitiesMap.forEach(entity => {
            if(entity.components[componentKey] != null)
                newArr.push(entity)
        })
        return newArr
    }
    static loadFile(absoluteName){
        // TODO - IMPLEMENT LOADING API FOR WEB AND NATIVE
    }
}