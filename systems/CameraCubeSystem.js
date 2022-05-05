import System from "../basic/System";

export default class CameraCubeSystem extends System {
    constructor(id) {
        super([]);
        this.renderTarget = document.getElementById(id.replace('-canvas',  '-camera'))
    }

    execute(options) {
        super.execute()
        const {camera} = options

        if(this.renderTarget) {
            const t = camera.getNotTranslatedViewMatrix()
            this.renderTarget.style.transform = `translateZ(calc(var(--cubeSize) * -3)) matrix3d(${t})`
        }
    }
}