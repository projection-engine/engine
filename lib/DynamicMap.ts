export default class DynamicMap {
    #array = []
    #map = {}

    add<T>(key:string, value:T) {
        this.#map[key] = value
        this.#array = Object.values(this.#map)
    }

    delete(key:string) {
        if (!this.#map[key])
            return
        delete this.#map[key]
        this.#array = Object.values(this.#map)
    }

    get array():any[] {
        return this.#array
    }
}