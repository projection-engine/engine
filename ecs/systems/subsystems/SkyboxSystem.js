import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import * as shaderCode from "../../../shaders/misc/skybox.glsl";
import Shader from "../../../utils/workers/Shader";
import {createTexture, createVAO, lookAt} from "../../../utils/misc/utils";
import VBO from "../../../utils/workers/VBO";
import cube from "../../../assets/cube.json";
import * as skyboxCode from "../../../shaders/misc/skybox.glsl";
import CubeMapInstance from "../../../instances/CubeMapInstance";
import * as shaderCodeSkybox from '../../../shaders/misc/cubeMap.glsl'
import ImageProcessor from "../../../../workers/image/ImageProcessor";
import TextureInstance from "../../../instances/TextureInstance";


export default class SkyboxSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.vao = createVAO(gpu)
        this._vertexBuffer = new VBO(gpu, 0, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
        this.baseShader = new Shader(shaderCodeSkybox.vertex, skyboxCode.generationFragment, this.gpu)
    }

    execute(skyboxElement, camera) {
        super.execute()
        if (skyboxElement && !skyboxElement.ready) {
            if (!skyboxElement.cubeMap)
                skyboxElement.cubeMap = new CubeMapInstance(this.gpu, skyboxElement.resolution, false)

            if(skyboxElement.blob) {
                skyboxElement.texture = createTexture(
                    this.gpu,
                    skyboxElement.blob.width,
                    skyboxElement.blob.height,
                    this.gpu.RGB16F,
                    0,
                    this.gpu.RGB,
                    this.gpu.FLOAT,
                    skyboxElement.blob,
                    this.gpu.LINEAR,
                    this.gpu.LINEAR,
                    this.gpu.CLAMP_TO_EDGE,
                    this.gpu.CLAMP_TO_EDGE
                )

                this.baseShader.use()
                skyboxElement.cubeMap.resolution = skyboxElement.resolution
                skyboxElement.cubeMap.draw((yaw, pitch, perspective) => {
                    this.baseShader.bindForUse({
                        projectionMatrix: perspective,
                        viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                        uSampler: skyboxElement.texture
                    })
                    this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
                }, true)

                skyboxElement.cubeMap.generateIrradiance()
                skyboxElement.cubeMap.generatePrefiltered(skyboxElement.prefilteredMipmaps, skyboxElement.resolution / skyboxElement.prefilteredMipmaps)
                skyboxElement.ready = true
                skyboxElement.blob = null
            }
        }

        if (skyboxElement && skyboxElement.ready && !(camera instanceof OrthographicCamera)) {
            this.gpu.depthMask(false)
            this.shader.use()
            this.gpu.bindVertexArray(this.vao)
            this._vertexBuffer.enable()

            this.shader.bindForUse({
                uTexture: skyboxElement.cubeMap.texture,
                projectionMatrix: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                gamma: skyboxElement.gamma,
                exposure: skyboxElement.exposure
            })

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            this._vertexBuffer.disable()

            this.gpu.depthMask(true)
        }
    }
}