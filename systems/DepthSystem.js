import System from "../basic/System";
import FramebufferInstance from "../instances/FramebufferInstance";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/shadows/SHADOW_MAP.glsl'
import COMPONENTS from "../templates/COMPONENTS";

export default class DepthSystem extends System {
    _ready = false

    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture({
                precision: this.gpu.R32F,
                format: this.gpu.RED,
                type: this.gpu.FLOAT,
                linear: true,
                repeat: true
            })
            .depthTest()

        this.shader = new ShaderInstance(shaderCode.vertexDepth, shaderCode.depth, gpu)
    }
    get depth(){
        return this.frameBuffer.colors[0]
    }
    execute(options, systems, data) {
        super.execute()
        const {meshes, meshSources} = data
        const {camera} = options

        this.frameBuffer.startMapping()
        this.shader.use()
        for(let i in meshes){
            const mesh = meshes[i]
            const meshRef = meshSources[mesh.components[COMPONENTS.MESH].meshID]
            if(meshRef) {
                meshRef.use()
                this.shader.bindForUse({
                    viewMatrix: camera.viewMatrix,
                    transformMatrix: mesh.components[COMPONENTS.TRANSFORM].transformationMatrix,
                    projectionMatrix: camera.projectionMatrix
                })
                this.gpu.drawElements(this.gpu.TRIANGLES, meshRef.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
                meshRef.finish()
            }
        }
        this.frameBuffer.stopMapping()
        this.gpu.bindVertexArray(null)
    }
}