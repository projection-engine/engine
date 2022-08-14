import ENVIRONMENT from "./data/ENVIRONMENT";
import Renderer from "./Renderer";

export default class UIRenderer{
    static renderTarget
    static entities = []
    static start(){
        if(!UIRenderer.renderTarget && (Renderer.environment === ENVIRONMENT.EXECUTION || Renderer.environment === ENVIRONMENT.PRODUCTION))
            return
        const components = UIRenderer.entities
        for (let i = 0; i < components.length; i++){
            if(!components[i].parent)
                components[i].parent = UIRenderer.renderTarget
            if(components[i].mountingPoint)
            components[i].mountingPoint.mount()
        }
    }

    static stop(){
        if(!UIRenderer.renderTarget)
            return
        const components = UIRenderer.entities
        for (let i = 0; i < components.length; i++) {
            if (components[i].mountingPoint)
                components[i].mountingPoint.unmount()
        }
    }
}