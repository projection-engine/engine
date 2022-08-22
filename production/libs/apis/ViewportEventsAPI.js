import ENVIRONMENT from "../../data/ENVIRONMENT";
import UserInterfaceController from "../../UserInterfaceController";
import RendererController from "../../RendererController";
import {v4} from "uuid";

export default class ViewportEventsAPI {
    static get targetElement() {
        if (RendererController.environment === ENVIRONMENT.DEV)
            return window.gpu.canvas
        return UserInterfaceController.renderTarget
    }

    static get isCursorLocked() {
        return document.pointerLockElement != null
    }

    static lockPointer() {
        if (!ViewportEventsAPI.isCursorLocked)
            ViewportEventsAPI.targetElement.requestPointerLock()
    }

    static #events = new Map()

    static addEvent(name, callback, options, id = v4()) {
        if (!ViewportEventsAPI.#events.get(name)) {
            const newListener = {callbacks: new Map([[id, callback]])}
            const handler = function (event) {
                newListener.callbacks.forEach(callback => callback(event))
            }
            newListener.handler = handler
            ViewportEventsAPI.targetElement.addEventListener(name, handler, options)
            newListener.remove = () => {
                ViewportEventsAPI.targetElement.removeEventListener(name, handler)
            }
            ViewportEventsAPI.#events.set(name, newListener)
        } else
            ViewportEventsAPI.#events.get(name).callbacks.set(id, callback)
    }

    static removeEvent(name, id) {
        const listener = ViewportEventsAPI.#events.get(name)
        if (!listener || !listener.callbacks.get(id))
            return false
        listener.callbacks.delete(id)
        if (listener.callbacks.size === 0) {
            listener.remove()
            ViewportEventsAPI.#events.delete(name)
        }
        return true
    }
}