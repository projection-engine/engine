export default class System {


    constructor(requiredComponents = []) {

    }
    updateFBOResolution(){}
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