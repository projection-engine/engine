import Engine from "../../Engine";
import Entity from "../../instances/Entity";

export default class QueryAPI {
    static getEntityByQueryID(id:string):Entity|undefined {
        return Engine.queryMap.get(id)
    }

    static getEntityByID(id:string):Entity|undefined {
        return Engine.entities.map.get(id)
    }

    static getEntitiesWithNativeComponent(componentKey:string):Entity[]{
        const newArr = []
        for (let i = 0; i < Engine.entities.array.length; i++) {
            const entity = Engine.entities.array[i]
            if (entity.components.get(componentKey) != null)
                newArr.push(entity)
        }
        return newArr
    }


    static getEntityByPickerID(id:number):Entity|undefined {
        if (id === 0)
            return
        const entities = Engine.entities.array
        return entities.find(e => e?.pickIndex === id)
    }

}