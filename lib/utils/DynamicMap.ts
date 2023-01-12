export default class DynamicMap <T>{
    array:T[] = []
    #map:{[key:string]:T} = {}

    add(key:string, value:T) {
        this.#map[key] = value
        this.array.push(value)
    }

    delete(key:string) {
        if (!this.#map[key])
            return
        this.array.splice(this.array.indexOf(this.#map[key]), 1)
        delete this.#map[key]
    }

}