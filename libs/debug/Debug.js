import parseMessage from "./libs/parse-message";
import ENVIRONMENT from "../../data/ENVIRONMENT";
import Renderer from "../../Renderer";

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

    static #pushMessages(type, messages, src) {
        if(Renderer.environment === ENVIRONMENT.PRODUCTION || Renderer.environment === ENVIRONMENT.DEV)
            return
        Debug.#messages.push(...parseMessage(messages, type, src))

        Debug.#metadata.errors += type === types.ERROR ? 1 : 0
        Debug.#metadata.logs += type === types.LOG ? 1 : 0
        Debug.#metadata.warns += type === types.WARN ? 1 : 0


        if (Debug.#messages.length > 50)
            Debug.#messages.shift()

        Debug.#updateConsoles()
    }

    static registerConsole(element, onUpdate) {
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
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }


        Debug.#pushMessages(types.LOG, messages, src)
    }

    static warn(...messages) {
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        Debug.#pushMessages(types.WARN, messages, src)
    }

    static error(...messages) {
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        Debug.#pushMessages(types.ERROR, messages, src)
    }

    static get TYPES() {
        return types
    }
}