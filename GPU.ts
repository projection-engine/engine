import LineAPI from "./lib/rendering/LineAPI";
import ImageProcessor from "./lib/math/ImageProcessor";
import TerrainGenerator from "./lib/math/TerrainGenerator";
import CameraAPI from "./lib/utils/CameraAPI";
import EntityWorkerAPI from "./lib/utils/EntityWorkerAPI";
import CubeMapAPI from "./lib/rendering/CubeMapAPI";
import LightsAPI from "./lib/utils/LightsAPI";
import QUAD_VERT from "./shaders/post-processing/QUAD.vert"
import BRDF_FRAG from "./shaders/post-processing/BRDF_GEN.frag"
import Shader from "./instances/Shader";
import Framebuffer from "./instances/Framebuffer";
import Material from "./instances/Material";
import COMPONENTS from "./static/COMPONENTS";
import {mat4, vec3} from "gl-matrix";
import CUBE_MAP_VIEWS from "./static/CUBE_MAP_VIEWS";
import SceneRenderer from "./runtime/SceneRenderer";
import Mesh from "./instances/Mesh";
import Texture from "./instances/Texture";
import Entity from "./instances/Entity";
import LightProbe from "./instances/LightProbe";
import SkyLightComponent from "./templates/components/SkyLightComponent";
import StaticShaders from "./lib/StaticShaders";
import StaticMeshes from "./lib/StaticMeshes";
import StaticFBO from "./lib/StaticFBO";
import UberShader from "./utils/UberShader";

export default class GPU {
    static context?: WebGL2RenderingContext
    static canvas?: HTMLCanvasElement
    static activeShader?: WebGLProgram
    static activeFramebuffer?: WebGLFramebuffer
    static activeMesh?: Mesh
    static materials = new Map<string, Material>()
    static shaders = new Map<string, Shader>()
    static frameBuffers = new Map<string, Framebuffer>()
    static meshes = new Map<string, Mesh>()
    static textures = new Map<string, Texture>()
    static BRDF: WebGLTexture
    static internalResolution = {w: 0, h: 0}
    static #activeSkylightEntity?: Entity
    static skylightProbe: LightProbe
    static bufferResolution = new Float32Array([0,0])
    static set activeSkylightEntity(entity: Entity | undefined) {
        GPU.#activeSkylightEntity = entity
        GPU.updateSkylight()
    }

    static get activeSkylightEntity(): Entity | undefined {
        return GPU.#activeSkylightEntity
    }


    static updateSkylight(): void {
        const entity = GPU.#activeSkylightEntity
        if (!GPU.skylightProbe) {
            UberShader.UBO.bind()
            UberShader.UBO.updateData("hasSkylight", new Uint8Array([0]))
            UberShader.UBO.unbind()
            return
        }
        if (entity) {

            const skylight = <SkyLightComponent>entity.components.get(COMPONENTS.SKYLIGHT)

            UberShader.UBO.bind()
            UberShader.UBO.updateData("hasSkylight", new Uint8Array([1]))
            UberShader.UBO.updateData("skylightSamples", skylight.mipmaps)
            UberShader.UBO.unbind()

            GPU.skylightProbe.resolution = skylight.resolution
            const tempView = mat4.create(), tempPosition = vec3.create(), tempViewProjection = mat4.create()
            GPU.skylightProbe.draw((yaw, pitch, projection, index): void => {
                vec3.add(tempPosition, entity._translation, <vec3>CUBE_MAP_VIEWS.target[index])
                mat4.lookAt(tempView, entity._translation, tempPosition, <vec3>CUBE_MAP_VIEWS.up[index])
                mat4.multiply(tempViewProjection, projection, tempView)
                SceneRenderer.execute(true, <Float32Array>tempViewProjection, <Float32Array>tempView, <Float32Array>tempPosition)
            })
        }
    }

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

            // preserveDrawingBuffer: true,
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


        UberShader.initialize()
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