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
            cubeBuffer,
            skyboxShader
        } = data
        const {
            camera,
            isOrtho
        } = options
        SkyboxSystem.draw(this.gpu, skybox, cubeBuffer, camera.viewMatrix, camera.projectionMatrix, skyboxShader, isOrtho)
    }

    static draw(gpu, skybox, cubeBuffer, view, projection, shader, isOrtho) {
        if (skybox && skybox.ready && !isOrtho) {
            gpu.depthMask(false)
            shader.use()

            cubeBuffer.enable()
            shader.bindForUse({
                uTexture: skybox.cubeMap.texture,
                projectionMatrix: projection,
                viewMatrix: view,
                gamma: skybox.gamma,
                exposure: skybox.exposure
            })

            gpu.drawArrays(gpu.TRIANGLES, 0, 36)
            cubeBuffer.disable()

            gpu.depthMask(true)
        }
    }
}