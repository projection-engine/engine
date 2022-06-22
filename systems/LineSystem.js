import System from "../basic/System"
import ShaderInstance from "../instances/ShaderInstance"
import * as shaderCode from "../shaders/LINE.glsl"
import COMPONENTS from "../templates/COMPONENTS"
import Entity from "../basic/Entity"
import LineComponent from "../components/LineComponent"

export default class LineSystem extends System {
    ready = false

    constructor() {
        super()
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.actor = new Entity(undefined, "Line")
        this.actor.components[COMPONENTS.LINE] = new LineComponent()
        this.actor.components[COMPONENTS.LINE].placement = {origin: [0,0,0], destination: [10, 10, 0]}
    }

    execute() {
        // super.execute()
        //
        // const lines = [this.actor]
        // if (this.ready) {
        //     const {camera} = options
        //     const l = lines.length
        //
        //     this.cube.use()
        //     this.shader.use()
        //     for (let i = 0; i < l; i++) {
        //         this.shader.bindForUse({
        //             viewMatrix: camera.viewMatrix,
        //             projectionMatrix: camera.projectionMatrix,
        //             transformMatrix: lines[i].components[COMPONENTS.LINE].transformationMatrix
        //         })
        //         window.gpu.drawElements(window.gpu.TRIANGLES, this.cube.verticesQuantity, window.gpu.UNSIGNED_INT, 0)
        //     }
        //     this.cube.finish()
        //     window.gpu.bindVertexArray(null)
        // }
    }
}
