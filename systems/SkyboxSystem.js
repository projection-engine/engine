import System from "../basic/System"
import * as shaderCode from "../shaders/SKYBOX.glsl"
import ShaderInstance from "../instances/ShaderInstance"

export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([])
        this.gpu = gpu
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(data, options) {
        super.execute()
        const {
            skybox,
            cubeBuffer,
            skyboxShader
        } = data
        const {camera} = options
        SkyboxSystem.draw(this.gpu, skybox, cubeBuffer, camera.viewMatrix, camera.projectionMatrix, skyboxShader, camera.ortho)
    }

    static draw(gpu, skybox, cubeBuffer, view, projection, shader, isOrtho) {
        if (skybox && skybox.ready && !isOrtho) {
            gpu.depthMask(false)
            shader.use()

            cubeBuffer.enable()
            shader.bindForUse({
                uTexture: skybox.cubeMap.texture,
                projectionMatrix: projection,
                viewMatrix: view
            })

            gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            cubeBuffer.disable()

            gpu.depthMask(true)
        }
    }
}