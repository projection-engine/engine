import System from "../../basic/System";
import * as shaderCode from "../../../shaders/mesh/translucentMesh.glsl";
import * as shaderBaseCode from "../../../shaders/mesh/forwardMesh.glsl";
import Shader from "../../../utils/workers/Shader";


export default class TransparencySystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderBaseCode.vertex, shaderCode.fragment, gpu)
    }

    execute(transparentMeshes, materials) {
        super.execute()
        // console.log(transparentMeshes)

    }
}