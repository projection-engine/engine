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

    removeBlock(resources: T[], getIDCallback: Function) {
        const toRemoveMap = {}
        for (let i = 0; i < resources.length; i++) {
            toRemoveMap[getIDCallback(resources[i])] = 1
        }

        for (let i = 0; i < this.array.length; i++) {
            const ID = getIDCallback(this.array[i])
            if (toRemoveMap[ID] === 1) {
                this.map.delete(ID)
                this.array[i] = undefined
            }
        }
        this.array = this.array.filter(e => e !== undefined)
    }
    addBlock(resources: T[], getIDCallback: Function) {
        this.array.push(...resources)
        for(let i =0; i < resources.length; i++){
            const current = resources[i]
            this.map.set(getIDCallback(current), current)
        }

    }
}