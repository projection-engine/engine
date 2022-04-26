import System from "../basic/System";

export default class CameraCubeSystem extends System {
    constructor(renderTarget) {
        super([]);
        this.renderTarget = document.getElementById(renderTarget)
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