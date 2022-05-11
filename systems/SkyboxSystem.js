import System from "../basic/System";
import * as shaderCode from "../shaders/misc/skybox.glsl";
import ShaderInstance from "../instances/ShaderInstance";


export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(data, options) {
        super.execute()
        const {
            skybox,
            cubeBuffer
        } = data
        const {
            camera,
            isOrtho
        } = options
        if (skybox && skybox.ready && !isOrtho) {
            this.gpu.depthMask(false)
            this.shader.use()

            cubeBuffer.enable()
            this.shader.bindForUse({
                uTexture: skybox.cubeMap.texture,
                projectionMatrix: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                gamma: skybox.gamma,
                exposure: skybox.exposure
            })

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            cubeBuffer.disable()

            this.gpu.depthMask(true)
        }
    }
}