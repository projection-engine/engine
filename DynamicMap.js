export default class DynamicMap{
    #map = new Map()
    #array = []
    add(key, value){
        this.#array.push(value)
        const index = this.#array.length - 1
        this.#map.set(key, index)
    }
    delete(key){
        const position = this.#map.get(key)
        if(position === undefined)
            return
        this.#array.splice(position, 1)
        this.#map.delete(key)
    }
    get array(){
        return this.#array
    }
}