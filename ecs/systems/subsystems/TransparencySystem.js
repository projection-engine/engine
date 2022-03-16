import System from "../../basic/System";
import OrthographicCamera from "../../../utils/camera/ortho/OrthographicCamera";
import * as shaderCode from "../../../shaders/mesh/translucentMesh.glsl";
import * as shaderBaseCode from "../../../shaders/mesh/forwardMesh.glsl";
import Shader from "../../../utils/workers/Shader";
import {createVAO} from "../../../utils/misc/utils";
import VBO from "../../../utils/workers/VBO";
import cube from "../../../assets/cube.json";

export default class TransparencySystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderBaseCode.vertex, shaderCode.fragment, gpu)
    }

    execute(transparentMeshes, materials) {
        super.execute()
        console.log(transparentMeshes)

    }
}