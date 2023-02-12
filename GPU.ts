import LineAPI from "./lib/rendering/LineAPI";
import ImageProcessor from "./lib/math/ImageProcessor";
import TerrainGenerator from "./lib/math/TerrainGenerator";
import CameraAPI from "./lib/utils/CameraAPI";
import EntityWorkerAPI from "./lib/utils/EntityWorkerAPI";
import CubeMapAPI from "./lib/rendering/CubeMapAPI";
import QUAD_VERT from "./shaders/post-processing/QUAD.vert"
import BRDF_FRAG from "./shaders/post-processing/BRDF_GEN.frag"
import Shader from "./instances/Shader";
import Framebuffer from "./instances/Framebuffer";
import Material from "./instances/Material";
import Mesh from "./instances/Mesh";
import Texture from "./instances/Texture";
import LightProbe from "./instances/LightProbe";
import StaticShaders from "./lib/StaticShaders";
import StaticMeshes from "./lib/StaticMeshes";
import StaticFBO from "./lib/StaticFBO";
import StaticUBOs from "./lib/StaticUBOs";

export default class GPU {
    static context?: WebGL2RenderingContext
    static canvas?: HTMLCanvasElement
    static activeShader?: Shader
    static activeFramebuffer?: Framebuffer
    static activeMesh?: Mesh
    static materials = new Map<string, Material>()
    static shaders = new Map<string, Shader>()
    static frameBuffers = new Map<string, Framebuffer>()
    static meshes = new Map<string, Mesh>()
    static textures = new Map<string, Texture>()
    static BRDF: WebGLTexture
    static internalResolution = {w: 0, h: 0}
    static skylightProbe: LightProbe
    static bufferResolution = new Float32Array([0,0])

    static async initializeContext(canvas: HTMLCanvasElement, mainResolution: { w: number, h: number } | undefined) {
        if (GPU.context != null)
            return

        const screen = window.screen
        GPU.internalResolution.w = mainResolution?.w || screen.width
        GPU.internalResolution.h = mainResolution?.h || screen.height
        GPU.bufferResolution[0] = GPU.internalResolution.w
        GPU.bufferResolution[1] = GPU.internalResolution.h
        GPU.context = canvas.getContext("webgl2", {
            antialias: false,
            // preserveDrawingBuffer: false,
            premultipliedAlpha: false,
            powerPreference: "high-performance"
        })
        GPU.canvas = canvas
        GPU.context.getExtension("EXT_color_buffer_float")
        GPU.context.getExtension("OES_texture_float")
        GPU.context.getExtension("OES_texture_float_linear")

        GPU.context.enable(GPU.context.BLEND)
        GPU.context.blendFunc(GPU.context.SRC_ALPHA, GPU.context.ONE_MINUS_SRC_ALPHA)
        GPU.context.enable(GPU.context.CULL_FACE)
        GPU.context.cullFace(GPU.context.BACK)
        GPU.context.enable(GPU.context.DEPTH_TEST)
        GPU.context.depthFunc(GPU.context.LESS)
        GPU.context.frontFace(GPU.context.CCW)


        StaticUBOs.initialize()
        CameraAPI.initialize()
        await StaticMeshes.initialize()
        StaticShaders.initialize()
        StaticFBO.initialize()
        EntityWorkerAPI.initialize()
        TerrainGenerator.initialize()
        ImageProcessor.initialize()

        CubeMapAPI.initialize()
        LineAPI.initialize()

        const FBO = new Framebuffer(512, 512).texture({precision: GPU.context.RG32F, format: GPU.context.RG})
        const brdfShader = new Shader(QUAD_VERT, BRDF_FRAG)

        FBO.startMapping()
        brdfShader.bind()
        StaticMeshes.drawQuad()
        FBO.stopMapping()
        GPU.BRDF = FBO.colors[0]
        GPU.context.deleteProgram(brdfShader.program)
    }

}