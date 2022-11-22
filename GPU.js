import LineAPI from "./lib/rendering/LineAPI";
import ImageProcessor from "./lib/math/ImageProcessor";
import TerrainGenerator from "./lib/math/TerrainGenerator";
import CameraAPI from "./lib/utils/CameraAPI";
import TransformationPass from "./runtime/misc/TransformationPass";
import CubeMapAPI from "./lib/rendering/CubeMapAPI";
import initializeShaders from "./utils/initialize-shaders";
import initializeStaticMeshes from "./utils/initialize-static-meshes";
import initializeFrameBuffers from "./utils/initialize-frame-buffers";
import LightsAPI from "./lib/rendering/LightsAPI";
import QUAD_VERT from "./shaders/QUAD.vert"
import BRDF_FRAG from "./shaders/BRDF_GEN.frag"
import Shader from "./instances/Shader";
import Framebuffer from "./instances/Framebuffer";
import GPUAPI from "./lib/rendering/GPUAPI";
import DEFAULT_MATERIAL_FRAG from "./shaders/DEFAULT_MATERIAL.frag";

import MATERIAL_RENDERING_TYPES from "./static/MATERIAL_RENDERING_TYPES";
import FALLBACK_MATERIAL from "./static/FALLBACK_MATERIAL";

export default class GPU {
    static context
    static activeShader
    static activeFramebuffer
    static activeMesh
    static materials = new Map()
    static shaders = new Map()
    static frameBuffers = new Map()
    static meshes = new Map()
    static instancingGroup = new Map()
    static textures = new Map()
    static cubeBuffer
    static BRDF
    static internalResolution
    static samplerResolutions
    static quad


    static async initializeContext(canvas, mainResolution, AOResolution, GIResolution) {
        if (GPU.context != null)
            return
        const screen = window.screen
        GPU.internalResolution = {w: screen.width, h: screen.height}
        GPU.samplerResolutions = {
            AO: {w: screen.width, h: screen.height},
            GI: {w: screen.width, h: screen.height}
        }
        if (mainResolution?.w > 0 && mainResolution?.h > 0)
            GPU.internalResolution = mainResolution
        if (AOResolution?.w > 0 && AOResolution?.h > 0)
            GPU.samplerResolutions.AO = AOResolution
        if (GIResolution?.w > 0 && GIResolution?.h > 0)
            GPU.samplerResolutions.GI = GIResolution


        window.gpu = canvas.getContext("webgl2", {
            antialias: false,
            preserveDrawingBuffer: true,
            premultipliedAlpha: false
        })
        GPU.context = gpu

        gpu.getExtension("EXT_color_buffer_float")
        gpu.getExtension("OES_texture_float")
        gpu.getExtension("OES_texture_float_linear")
        gpu.enable(gpu.BLEND)
        gpu.blendFunc(gpu.SRC_ALPHA, gpu.ONE_MINUS_SRC_ALPHA)
        gpu.enable(gpu.CULL_FACE)
        gpu.cullFace(gpu.BACK)
        gpu.enable(gpu.DEPTH_TEST)
        gpu.depthFunc(gpu.LESS)
        gpu.frontFace(gpu.CCW)

        CameraAPI.initialize()
        LightsAPI.initialize()
        TransformationPass.initialize()
        TerrainGenerator.initialize()
        ImageProcessor.initialize()


        initializeFrameBuffers()
        initializeStaticMeshes()
        initializeShaders()
        GPUAPI.allocateMaterial(
            {
                vertex: QUAD_VERT,
                fragment: DEFAULT_MATERIAL_FRAG,
                cubeMapShaderCode: "",
                settings: {
                    shadingType: MATERIAL_RENDERING_TYPES.DEFERRED
                }
            },
            FALLBACK_MATERIAL
        )
        CubeMapAPI.initialize()
        LineAPI.initialize()

        const FBO = new Framebuffer(512, 512).texture({precision: gpu.RG32F, format: gpu.RG})
        const brdfShader = new Shader(QUAD_VERT, BRDF_FRAG)

        FBO.startMapping()
        brdfShader.bindForUse({})
        drawQuad()
        FBO.stopMapping()
        GPU.BRDF = FBO.colors[0]
        gpu.deleteProgram(brdfShader.program)
    }

}