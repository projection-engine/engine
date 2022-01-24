import System from "../basic/System";

export default class InfoRendererSystem extends System{
    constructor() {
        super();
        this.shader = undefined
    }
    execute(entities, params, systems) {
        super.execute()
        const  {
            meshes,
            materials,

            selectedElement,
            setSelectedElement,
        } = params


    }
}