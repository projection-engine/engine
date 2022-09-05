import ENVIRONMENT from "../data/ENVIRONMENT";
import UserInterfaceController from "../controllers/UserInterfaceController";
import RendererController from "../controllers/RendererController";

function getTarget(key) {
    const events = InputEventsAPI.EVENTS
    if (key === events.MOUSE_DOWN || key === events.CLICK || key === events.DOUBLE_CLICK || key === events.WHEEL)
        return InputEventsAPI.targetElement
    return document.body
}

export default class InputEventsAPI {
    static #events = new Map()
    static EVENTS = Object.freeze({
        KEY_DOWN: "keydown",
        KEY_UP: "keyup",
        MOUSE_MOVE: "mousemove",
        CLICK: "click",
        DOUBLE_CLICK: "dblclick",
        MOUSE_DOWN: "mousedown",
        MOUSE_UP: "mouseup",
        WHEEL: "wheel", // passive
    })

    static listenTo(eventKey, callback, id) {
        const target = getTarget(eventKey)
        if (!InputEventsAPI.#events.get(eventKey)) {
            const newListener = {callbacks: new Map([[id, callback]])}
            const handler =  (event)  => {
                newListener.callbacks.forEach(callback => callback(event))
            }
            target.addEventListener(eventKey, handler, eventKey === InputEventsAPI.EVENTS.WHEEL ? {passive: true} : undefined)
            newListener.remove = () => target.removeEventListener(eventKey, handler)
            InputEventsAPI.#events.set(eventKey, newListener)
        } else
            InputEventsAPI.#events.get(eventKey).callbacks.set(id, callback)
    }

    static removeEvent(eventKey, id) {
        const listener = InputEventsAPI.#events.get(eventKey)
        if (!listener || !listener.callbacks.get(id))
            return false
        listener.callbacks.delete(id)
        if (listener.callbacks.size === 0) {
            listener.remove()
            InputEventsAPI.#events.delete(eventKey)
        }
        return true
    }

    static get targetElement() {
        if (RendererController.environment === ENVIRONMENT.DEV)
            return window.gpu.canvas
        return UserInterfaceController.renderTarget
    }

    static get isCursorLocked() {
        return document.pointerLockElement != null
    }

    static lockPointer() {
        if (!InputEventsAPI.isCursorLocked)
            document.body.requestPointerLock()
    }


}