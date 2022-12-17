import Engine from "../../Engine";
import Entity from "../../instances/Entity";

export default class QueryAPI {
    static getEntityByQueryID(id:string):Entity|undefined {
        return Engine.queryMap.get(id)
    }

    static getEntityByID(id:string):Entity|undefined {
        return Engine.entitiesMap.get(id)
    }

    static getEntitiesWithNativeComponent(componentKey:string):Entity[]{
        const newArr = []
        for (let i = 0; i < Engine.entities.length; i++) {
            const entity = Engine.entities[i]
            if (entity.components.get(componentKey) != null)
                newArr.push(entity)
        }
        return newArr
    }


    static getEntityByPickerID(id:number):Entity|undefined {
        if (id === 0)
            return
        const entities = Engine.entities
        return entities.find(e => e?.pickIndex === id)
    }

}