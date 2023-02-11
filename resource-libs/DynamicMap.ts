export default class DynamicMap<T> {
    array: T[] = []
    map = new Map<string, T>()

    add(key: string, value: T) {
        if (this.map.has(key))
            return
        this.map.set(key, value)
        this.array.push(value)
    }

    has(key: string): boolean {
        return this.map.has(key)
    }

    get(key: string): T | undefined {
        return this.map.get(key)
    }

    clear() {
        this.array.length = 0
        this.map.clear()
    }

    delete(key: string) {
        const found = this.map.get(key)
        if (!found)
            return
        this.array.splice(this.array.findIndex(v => v === found), 1)
        this.map.delete(key)
    }

}