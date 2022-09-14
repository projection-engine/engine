import {v4} from "uuid";

export default class UIAPI {
    static ID = v4()
    static #renderTarget
    static entities = new Map()

    static get renderTarget() {
        if (!UIAPI.#renderTarget && window.gpu) {

            const t = document.createElement("span")
            UIAPI.#renderTarget = t
            Object.assign(t.style, {
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                zIndex: 1
            })
            gpu.canvas.before(t)

        }
        return UIAPI.#renderTarget
    }

    static start() {

        if (!UIAPI.renderTarget)
            return
        const components = Array.from(UIAPI.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].mount()
        UIAPI.#renderTarget.style.display = "initial"
    }

    static stop() {
        if (!UIAPI.#renderTarget)
            return
        const components = Array.from(UIAPI.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].unmount()
        UIAPI.#renderTarget.style.display = "none"
    }

    static restart() {
        UIAPI.stop()
        UIAPI.start()
    }
}