export default class System {
    constructor(requiredComponents = []) {
    }
    updateFBOResolution(){}
    execute() {}
    _find(elements, compare) {
        let found = []
        const l = elements.length
        for (let i = 0; i < l; i++) {
            if (compare(elements[i]))
                found.push(elements[i])
        }
        return found
    }

}