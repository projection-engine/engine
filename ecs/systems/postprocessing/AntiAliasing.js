import System from "../../basic/System";
import Shader from "../../../utils/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import FramebufferInstance from "../../../instances/FramebufferInstance";


export default class AntiAliasing extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width , window.screen.height )
        this.frameBuffer
            .texture()

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)

    }

    execute(options, systems, data, entities, entitiesMap, onWrap) {
        super.execute()
    }
}