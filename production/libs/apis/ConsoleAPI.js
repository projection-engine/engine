import ENVIRONMENT from "../../data/ENVIRONMENT";
import RendererController from "../../RendererController";
import {v4} from "uuid";

const types = Object.freeze({
    ERROR: "ERROR",
    LOG: "LOG",
    WARN: "WARN"
})
export default class ConsoleAPI {
    static #registeredConsoles = []
    static #messages = []
    static #metadata = {errors: 0, logs: 0, warns: 0}

    static #updateConsoles() {
        const consoles = ConsoleAPI.#registeredConsoles

        for (let i = 0; i < consoles.length; i++) {
            if (consoles[i].onUpdate)
                consoles[i].onUpdate(
                    ConsoleAPI.#metadata,
                    ConsoleAPI.#messages
                )
        }
    }

    static #pushMessages(type, messages, src) {
        if(RendererController.environment === ENVIRONMENT.PRODUCTION || RendererController.environment === ENVIRONMENT.DEV)
            return
        ConsoleAPI.#messages.push(...parseMessage(messages, type, src))

        ConsoleAPI.#metadata.errors += type === types.ERROR ? 1 : 0
        ConsoleAPI.#metadata.logs += type === types.LOG ? 1 : 0
        ConsoleAPI.#metadata.warns += type === types.WARN ? 1 : 0


        if (ConsoleAPI.#messages.length > 50)
            ConsoleAPI.#messages.shift()

        ConsoleAPI.#updateConsoles()
    }

    static registerConsole(element, onUpdate) {
        ConsoleAPI.#registeredConsoles = [...ConsoleAPI.#registeredConsoles, {element, onUpdate}]
        ConsoleAPI.#updateConsoles()
    }

    static clear() {
        if(ConsoleAPI.#messages.length === 0)
            return
        ConsoleAPI.#messages = []
        ConsoleAPI.#metadata = {errors: 0, logs: 0, warns: 0}

        ConsoleAPI.#updateConsoles()
    }

    static unregisterConsole(element) {
        ConsoleAPI.#registeredConsoles = ConsoleAPI.#registeredConsoles.filter(c => c.element !== element)
    }

    static log(...messages) {
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }


        ConsoleAPI.#pushMessages(types.LOG, messages, src)
    }

    static warn(...messages) {
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        ConsoleAPI.#pushMessages(types.WARN, messages, src)
    }

    static error(...messages) {
        let src;
        try { throw new Error(); }
        catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        ConsoleAPI.#pushMessages(types.ERROR, messages, src)
    }

    static get TYPES() {
        return types
    }
}

const isPlainObject = value => value?.constructor === Object;
function parseMessage(messages, type, src) {
    let parts = []
    for (let i = 0; i < messages.length; i++) {
        const blockID = v4()
        if (typeof messages[i] === "object") {
            const str = isPlainObject(messages[i]) ? "Plain Object" : messages[i].constructor.name
            parts.push(...str.split("\n").map((message, i) => ({
                type,
                message: message + " " + messages[i].toString(),
                blockID,
                src,
                notFirstOnBlock: i > 0
            })))
        } else
            parts.push({
                type,
                message: messages[i],
                blockID,
                src
            })
    }
    return parts
}