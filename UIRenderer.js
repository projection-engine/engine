import {v4} from "uuid";

export default class UIRenderer {
    static ID = v4()
    static #renderTarget
    static entities = new Map()

    static get renderTarget() {
        if (!UIRenderer.#renderTarget && window.gpu) {

            const t = document.createElement("span")
            UIRenderer.#renderTarget = t
            Object.assign(t.style, {
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                zIndex: 1
            })
            gpu.canvas.before(t)

        }
        return UIRenderer.#renderTarget
    }

    static start() {

        if (!UIRenderer.renderTarget)
            return
        const components = Array.from(UIRenderer.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].mount()
        UIRenderer.#renderTarget.style.display = "initial"
    }

    static stop() {
        if (!UIRenderer.#renderTarget)
            return
        const components = Array.from(UIRenderer.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].unmount()
        UIRenderer.#renderTarget.style.display = "none"
    }

    static restart() {
        UIRenderer.stop()
        UIRenderer.start()
    }
}