import parseMessage from "./libs/parse-message";

const types = Object.freeze({
    ERROR: "ERROR",
    LOG: "LOG",
    WARN: "WARN"
})
export default class Debug {
    static #registeredConsoles = []
    static #messages = []
    static #metadata = {errors: 0, logs: 0, warns: 0}

    static #updateConsoles() {
        const consoles = Debug.#registeredConsoles

        for (let i = 0; i < consoles.length; i++) {
            if (consoles[i].onUpdate)
                consoles[i].onUpdate(
                    Debug.#metadata,
                    Debug.#messages
                )
        }
    }

    static #pushMessages(type, messages) {
        Debug.#messages.push({
            type,
            message: parseMessage(messages)
        })

        Debug.#metadata.errors += type === types.ERROR ? 1 : 0
        Debug.#metadata.logs += type === types.LOG ? 1 : 0
        Debug.#metadata.warns += type === types.WARN ? 1 : 0


        if (Debug.#messages.length > 50)
            Debug.#messages.shift()

        Debug.#updateConsoles()
    }

    static registerConsole(element, onUpdate) {
        if (element instanceof HTMLElement)
            Debug.#registeredConsoles = [...Debug.#registeredConsoles, {element, onUpdate}]
    }

    static clear() {
        if(Debug.#messages.length === 0)
            return
        Debug.#messages = []
        Debug.#metadata = {errors: 0, logs: 0, warns: 0}

        Debug.#updateConsoles()
    }

    static unregisterConsole(element) {
        Debug.#registeredConsoles = Debug.#registeredConsoles.filter(c => c.element !== element)
    }

    static log(...messages) {
        Debug.#pushMessages(types.LOG, messages)
    }

    static warn(...messages) {
        Debug.#pushMessages(types.WARN, messages)
    }

    static error(...messages) {
        Debug.#pushMessages(types.ERROR, messages)
    }

    static get TYPES() {
        return types
    }
}