export default class DynamicMap<K, T> extends Map {
    array: T[] = []

    get map(): Map<K, T> {
        return <Map<K, T>><unknown>this
    }

    set(key: K, value: T): this {
        if (this.has(key))
            return
        super.set(key, value)
        this.array.push(value)
        return this
    }

    clear() {
        super.clear()
        this.array.length = 0
    }

    delete(key: K): boolean {
        const found = this.get(key)
        if (!found)
            return false
        this.array.splice(this.array.indexOf(found), 1)
        return super.delete(key)
    }

    removeBlock(resources: T[], getIDCallback: Function) {
        const toRemoveMap = {}
        for (let i = 0; i < resources.length; i++) {
            toRemoveMap[getIDCallback(resources[i])] = 1
        }

        for (let i = 0; i < this.array.length; i++) {
            const ID = getIDCallback(this.array[i])
            if (toRemoveMap[ID] === 1) {
                super.delete(ID)
                this.array[i] = undefined
            }
        }
        this.array = this.array.filter(e => e !== undefined)
    }

    addBlock(resources: T[], getIDCallback: Function) {
        this.array.push(...resources)
        for (let i = 0; i < resources.length; i++) {
            const current = resources[i]
            super.set(getIDCallback(current), current)
        }
    }
}