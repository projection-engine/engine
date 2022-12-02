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
import QUAD_VERT from "./shaders/post-processing/QUAD.vert"
import BRDF_FRAG from "./shaders/post-processing/BRDF_GEN.frag"
import Shader from "./instances/Shader";
import Framebuffer from "./instances/Framebuffer";
import Material from "./instances/Material";
import COMPONENTS from "./static/COMPONENTS";
import {mat4, vec3} from "gl-matrix";
import CUBE_MAP_VIEWS from "./static/CUBE_MAP_VIEWS";
import SceneRenderer from "./runtime/rendering/SceneRenderer";

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
    static quad
    static __activeSkylightEntity

    static set activeSkylightEntity(entity) {
        GPU.__activeSkylightEntity = entity
        GPU.updateSkylight()
    }

    static get activeSkylightEntity() {
        return GPU.__activeSkylightEntity
    }

    static skylightProbe

    static updateSkylight() {
        const entity = GPU.__activeSkylightEntity
        if(!GPU.skylightProbe)
            return
        if (entity) {
            const skylight = entity.components.get(COMPONENTS.SKYLIGHT)
            GPU.skylightProbe.resolution = skylight.resolution
            const tempView = mat4.create(), tempPosition = vec3.create(), tempViewProjection = mat4.create()
            GPU.skylightProbe.draw((yaw, pitch, projection, index) => {
                 vec3.add(tempPosition, entity._translation, CUBE_MAP_VIEWS.target[index])
                 mat4.lookAt(tempView, entity._translation, tempPosition, CUBE_MAP_VIEWS.up[index])
                 mat4.multiply(tempViewProjection, projection, tempView)

                SceneRenderer.draw(true, tempViewProjection, tempView, tempPosition)
            })
        }
    }

    static async initializeContext(canvas, mainResolution) {
        if (GPU.context != null)
            return
        const screen = window.screen
        GPU.internalResolution = {w: screen.width, h: screen.height}

        if (mainResolution?.w > 0 && mainResolution?.h > 0)
            GPU.internalResolution = mainResolution


        window.gpu = canvas.getContext("webgl2", {
            antialias: false,
            // preserveDrawingBuffer: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance"
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
        Material.initialize()

        initializeFrameBuffers()
        initializeStaticMeshes()
        initializeShaders()

        CubeMapAPI.initialize()
        LineAPI.initialize()

        const FBO = new Framebuffer(512, 512).texture({precision: gpu.RG32F, format: gpu.RG})
        const brdfShader = new Shader(QUAD_VERT, BRDF_FRAG)

        FBO.startMapping()
        brdfShader.bind()
        drawQuad()
        FBO.stopMapping()
        GPU.BRDF = FBO.colors[0]
        gpu.deleteProgram(brdfShader.program)
    }

}