import {v4} from "uuid";

export default class UserInterfaceController {
    static ID = v4()
    static #renderTarget
    static entities = new Map()

    static get renderTarget() {
        if (!UserInterfaceController.#renderTarget && window.gpu) {

            const t = document.createElement("span")
            UserInterfaceController.#renderTarget = t
            Object.assign(t.style, {
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
                zIndex: 1
            })
            gpu.canvas.before(t)

        }
        return UserInterfaceController.#renderTarget
    }

    static start() {

        if (!UserInterfaceController.renderTarget)
            return
        const components = Array.from(UserInterfaceController.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].mount()
        UserInterfaceController.#renderTarget.style.display = "initial"
    }

    static stop() {
        if (!UserInterfaceController.#renderTarget)
            return
        const components = Array.from(UserInterfaceController.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].unmount()
        UserInterfaceController.#renderTarget.style.display = "none"
    }

    static restart() {
        UserInterfaceController.stop()
        UserInterfaceController.start()
    }
}