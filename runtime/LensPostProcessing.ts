import CameraAPI from "../lib/utils/CameraAPI";
import GPU from "../GPU";
import UBO from "../instances/UBO";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import BloomPrePass from "./BloomPrePass";
import Bokeh from "./Bokeh";
import MotionBlur from "./MotionBlur";
import StaticUBOs from "../lib/StaticUBOs";


export default class LensPostProcessing {

    static execute() {
        const context = GPU.context

        Bokeh.execute()
        MotionBlur.execute()
        BloomPrePass.execute()

        StaticFBO.lens.startMapping()
        StaticShaders.lens.bind()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing2Sampler)
        context.uniform1i(StaticShaders.lensUniforms.bloomColor, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing1Sampler)
        context.uniform1i(StaticShaders.lensUniforms.sceneColor, 1)

        StaticMeshes.drawQuad()
        StaticFBO.lens.stopMapping()
    }

}