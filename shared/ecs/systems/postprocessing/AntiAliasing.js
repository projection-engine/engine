import System from "../../basic/System";
import DeferredSystem from "./rendering/DeferredSystem";
import SkyboxSystem from "./rendering/SkyboxSystem";
import GlobalIlluminationSystem from "./rendering/gi/GlobalIlluminationSystem";
import SYSTEMS from "../../templates/SYSTEMS";
import Shader from "../../../utils/workers/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import FramebufferInstance from "../../../instances/FramebufferInstance";
import ForwardSystem from "./rendering/ForwardSystem";
import {copyTexture} from "../../utils/misc/utils";
import RENDERING_TYPES from "../../templates/RENDERING_TYPES";


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