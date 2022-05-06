import System from "../basic/System";
import OrthographicCamera from "../editor/camera/ortho/OrthographicCamera";
import * as shaderCode from "../shaders/misc/skybox.glsl";
import ShaderInstance from "../instances/ShaderInstance";
import {createVAO} from "../utils/utils";
import VBO from "../instances/VBO";
import cube from "../templates/CUBE.js";


export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.vao = createVAO(gpu)
        this._vertexBuffer = new VBO(gpu, 0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)

    }

    execute(data, options) {
        super.execute()
        const {
            skybox
        } = data
        const {
            camera,
            isOrtho
        } = options
        if (skybox && skybox.ready && !isOrtho) {
            this.gpu.depthMask(false)
            this.shader.use()
            this.gpu.bindVertexArray(this.vao)
            this._vertexBuffer.enable()

            this.shader.bindForUse({
                uTexture: skybox.cubeMap.texture,
                projectionMatrix: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                gamma: skybox.gamma,
                exposure: skybox.exposure
            })

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            this._vertexBuffer.disable()

            this.gpu.depthMask(true)
        }
    }
}