import parseMessage from "./parse-console-message";
import MessageInterface from "../../static/MessageInterface";

export enum Types {
    ERROR = "ERROR",
    LOG = "LOG",
    WARN = "WARN"
}

let oldError
let oldWarn
let oldLog
export default class ConsoleAPI {
    private static registeredConsoles = []
    private static messages:MessageInterface[] = []
    private static metadata = {errors: 0, logs: 0, warns: 0}
    static onMessageCallback?:Function

    static getErrorMessages() {
        return ConsoleAPI.messages.map(m => m.type === Types.ERROR)
    }

    private static updateConsoles() {
        const consoles = ConsoleAPI.registeredConsoles

        for (let i = 0; i < consoles.length; i++) {
            if (consoles[i].onUpdate)
                consoles[i].onUpdate(
                    ConsoleAPI.metadata,
                    ConsoleAPI.messages
                )
        }
    }

    private static pushMessages(type, messages, src) {
        if (ConsoleAPI.onMessageCallback)
            ConsoleAPI.onMessageCallback()

        ConsoleAPI.messages.push(...parseMessage(messages, type, src))

        ConsoleAPI.metadata.errors += type === Types.ERROR ? 1 : 0
        ConsoleAPI.metadata.logs += type === Types.LOG ? 1 : 0
        ConsoleAPI.metadata.warns += type === Types.WARN ? 1 : 0


        if (ConsoleAPI.messages.length > 50)
            ConsoleAPI.messages.shift()

        ConsoleAPI.updateConsoles()
    }

    static registerConsole(element, onUpdate) {
        ConsoleAPI.registeredConsoles = [...ConsoleAPI.registeredConsoles, {element, onUpdate}]
        ConsoleAPI.updateConsoles()
    }

    static clear() {
        if (ConsoleAPI.messages.length === 0)
            return
        ConsoleAPI.messages = []
        ConsoleAPI.metadata = {errors: 0, logs: 0, warns: 0}

        ConsoleAPI.updateConsoles()
    }

    static unregisterConsole(element) {
        ConsoleAPI.registeredConsoles = ConsoleAPI.registeredConsoles.filter(c => c.element !== element)
    }

    static log(...messages: any[]) {
        oldLog(...messages)
        let src;
        try {
            throw new Error();
        } catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        ConsoleAPI.pushMessages(Types.LOG, messages, src)
    }

    static warn(...messages) {
        oldWarn(...messages)
        let src;
        try {
            throw new Error();
        } catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }

        ConsoleAPI.pushMessages(Types.WARN, messages, src)
    }

    static error(...messages: any[]) {
        oldError(...messages)
        let src;
        try {
            throw new Error();
        } catch (e) {
            const stack = e.stack.split("\n")
            src = stack[2].replace(/\(eval\sat\s(\w+)\s\(((\/|\:|\w|\.|\W)+)\), <anonymous>:/gm, "").replace(")", "")
        }
        if (src.includes("file:///"))
            src = "Internal error"

        ConsoleAPI.pushMessages(Types.ERROR, messages, src)
    }

    static get TYPES() {
        return Types
    }
}

