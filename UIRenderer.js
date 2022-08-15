import ENVIRONMENT from "./data/ENVIRONMENT";
import Renderer from "./Renderer";

export default class UIRenderer {
    static renderTarget
    static entities = new Map()

    static start() {
        if (!UIRenderer.renderTarget && (Renderer.environment === ENVIRONMENT.EXECUTION || Renderer.environment === ENVIRONMENT.PRODUCTION))
            return
        const components = Array.from(UIRenderer.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].mount()

    }

    static stop() {
        if (!UIRenderer.renderTarget)
            return
        const components = Array.from(UIRenderer.entities.values())
        for (let i = 0; i < components.length; i++)
            components[i].unmount()
    }
}