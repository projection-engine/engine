import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import * as shaderCode from "../../../shaders/misc/skybox.glsl";
import Shader from "../../../utils/workers/Shader";
import {createVAO} from "../../../utils/misc/utils";
import VBO from "../../../utils/workers/VBO";
import cube from "../../../assets/cube.json";

export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.vao = createVAO(gpu)
        this._vertexBuffer = new VBO(gpu, 0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
    }

    execute(skyboxElement, camera) {
        super.execute()

        if (skyboxElement && skyboxElement.ready && !(camera instanceof OrthographicCamera)) {
            this.gpu.depthMask(false)
            this.shader.use()
            this.gpu.bindVertexArray(this.vao)
            this._vertexBuffer.enable()

            this.shader.bindForUse({
                uTexture: skyboxElement.cubeMap,
                projectionMatrix: camera.projectionMatrix,
                viewMatrix: camera.getNotTranslatedViewMatrix(),
                gamma: skyboxElement.gamma,
                exposure: skyboxElement.exposure
            })

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            this._vertexBuffer.disable()

            this.gpu.depthMask(true)
        }
    }
}