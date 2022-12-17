function getTarget(key) {
    const events = InputEventsAPI.EVENTS
    if (key === events.MOUSE_DOWN || key === events.CLICK || key === events.DOUBLE_CLICK || key === events.WHEEL)
        return InputEventsAPI.targetElement
    return document.body
}

export default class InputEventsAPI {
    static #callbacks = new Map()
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
        const existing =InputEventsAPI.#callbacks.get(id) || []
        InputEventsAPI.#callbacks.set(id, [...existing, {callback, target, eventKey}])
        target.addEventListener(eventKey, callback)
    }

    static removeEvent(id) {
        const existing =InputEventsAPI.#callbacks.get(id) || []
        for(let i =0; i < existing.length; i++) {
            const {callback, target, eventKey} = existing[i]
            target.removeEventListener(eventKey, callback)
        }
        InputEventsAPI.#callbacks.delete(id)
    }

    static get targetElement() {
        return window.GPUCanvas.parentElement
    }

    static get isCursorLocked() {
        return document.pointerLockElement != null
    }

    static lockPointer() {
        if (!InputEventsAPI.isCursorLocked)
            document.body.requestPointerLock()
    }


}