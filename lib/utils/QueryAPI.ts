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
        const size = entities.length
        for(let i = 0; i < size; i++){
            const current = entities[i]
            if(!current.active)
                continue
            console.log(current.pickIndex)
            if(current.pickIndex === id)
                return current
        }
    }

}