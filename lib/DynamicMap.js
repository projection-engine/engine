export default class DynamicMap {
    #array = []
    #map = {}

    add(key, value) {
        this.#map[key] = value
        this.#array = Object.values(this.#map)
    }

    delete(key) {
        if (!this.#map[key])
            return
        delete this.#map[key]
        this.#array = Object.values(this.#map)
    }

    get array() {
        return this.#array
    }
}