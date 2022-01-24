export default class System {
    required = []

    constructor(requiredComponents = []) {
        this.required = requiredComponents
    }

    _hasComponent(entities) {
        let n = []

        for (let i = 0; i < entities.length; i++) {
            let includes = true
            for (const compKey of this.required) {

                includes = includes && entities[i].components[compKey] !== undefined
            }
            if (includes)
                n.push(entities[i])
        }
        return n
    }

    execute() {}
    _find(elements, compare) {
        let found = []
        for (let i = 0; i < elements.length; i++) {
            if (compare(elements[i]))
                found.push(elements[i])
        }
        return found
    }

}