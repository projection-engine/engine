import System from "../basic/System";
import FramebufferInstance from "../instances/FramebufferInstance";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/shadows/shadow.glsl'
import COMPONENTS from "../templates/COMPONENTS";

export default class DepthSystem extends System {
    _ready = false

    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .depthTexture()
            .depthTest()
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
    }
    get depth(){
        return this.frameBuffer.depthSampler
    }
    execute(options, systems, data) {
        super.execute()
        const {meshes} = data
        const {camera} = options

        this.shader.use()
        for(let i in meshes){
            const mesh = meshes[i]
            this.shader.bindForUse({
                viewMatrix: camera.viewMatrix,
                transformMatrix: mesh.components[COMPONENTS.TRANSFORM].transformMatrix,
                projectionMatrix: camera.projectionMatrix
            })
        }
    }
}