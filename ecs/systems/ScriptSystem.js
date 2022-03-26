import System from "../basic/System";

import MaterialInstance from "../../instances/MaterialInstance";
import * as shaderCode from '../../shaders/mesh/meshDeferred.glsl'
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import brdfImg from "../../../../static/brdf_lut.jpg";
import {createTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../utils/misc/SYSTEMS";

export default class ScriptSystem extends System {

    constructor() {
        super([]);

        this.executors = {

        }
    }

    execute(options, systems, data) {
        super.execute()
        const {
            scriptedEntities
        } = data

        const {
            camera,
            selected,
            shadingModel,
            injectMaterial
        } = options

        const keys = Object.keys(scriptedEntities)
        for(let i = 0; i<keys.length; i++){
            const component = scriptedEntities[keys[i]]
            console.log(component)
        }
    }

}