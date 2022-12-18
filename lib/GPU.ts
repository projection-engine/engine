import LineAPI from "./rendering/LineAPI";
import ImageProcessor from "./math/ImageProcessor";
import TerrainGenerator from "./math/TerrainGenerator";
import CameraAPI from "./utils/CameraAPI";
import EntityWorkerAPI from "./utils/EntityWorkerAPI";
import CubeMapAPI from "./rendering/CubeMapAPI";
import initializeShaders from "../utils/initialize-shaders";
import initializeStaticMeshes from "../utils/initialize-static-meshes";
import initializeFrameBuffers from "../utils/initialize-frame-buffers";
import LightsAPI from "./utils/LightsAPI";

// @ts-ignore
import QUAD_VERT from "../shaders/post-processing/QUAD.vert"
// @ts-ignore
import BRDF_FRAG from "../shaders/post-processing/BRDF_GEN.frag"

import Shader from "../instances/Shader";
import Framebuffer from "../instances/Framebuffer";
import Material from "../instances/Material";
import COMPONENTS from "../static/COMPONENTS";
import {mat4, vec3} from "gl-matrix";
import CUBE_MAP_VIEWS from "../static/CUBE_MAP_VIEWS";
import SceneRenderer from "../runtime/rendering/SceneRenderer";
import Mesh from "../instances/Mesh";
import Texture from "../instances/Texture";
import VertexBuffer from "../instances/VertexBuffer";
import Entity from "../instances/Entity";
import LightProbe from "../instances/LightProbe";
import SkyLightComponent from "../templates/components/SkyLightComponent";

export default class GPU {
    static context: WebGL2RenderingContext
    static activeShader?: WebGLProgram
    static activeFramebuffer?: WebGLFramebuffer
    static activeMesh?: Mesh
    static materials = new Map<string, Material>()
    static shaders = new Map<string, Shader>()
    static frameBuffers = new Map<string, Framebuffer>()
    static meshes = new Map<string, Mesh>()
    static textures = new Map<string, Texture>()
    static cubeBuffer: VertexBuffer
    static BRDF: WebGLTexture
    static internalResolution = {w: 0, h: 0}
    static quad?: Mesh
    static #activeSkylightEntity?: Entity
    static skylightProbe: LightProbe

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
            SceneRenderer.UBO.bind()
            SceneRenderer.UBO.updateData("hasSkylight", new Uint8Array([0]))
            SceneRenderer.UBO.unbind()
            return
        }
        if (entity) {

            const skylight = <SkyLightComponent>entity.components.get(COMPONENTS.SKYLIGHT)

            SceneRenderer.UBO.bind()
            SceneRenderer.UBO.updateData("hasSkylight", new Uint8Array([1]))
            SceneRenderer.UBO.updateData("skylightSamples", skylight.mipmaps)
            SceneRenderer.UBO.unbind()

            GPU.skylightProbe.resolution = skylight.resolution
            const tempView = mat4.create(), tempPosition = vec3.create(), tempViewProjection = mat4.create()
            GPU.skylightProbe.draw((yaw, pitch, projection, index): void => {
                vec3.add(tempPosition, entity._translation, <vec3>CUBE_MAP_VIEWS.target[index])
                mat4.lookAt(tempView, entity._translation, tempPosition, <vec3>CUBE_MAP_VIEWS.up[index])
                mat4.multiply(tempViewProjection, projection, tempView)
                SceneRenderer.draw(true, <Float32Array>tempViewProjection, <Float32Array>tempView, <Float32Array>tempPosition)
            })
        }
    }

    static async initializeContext(canvas: HTMLCanvasElement, mainResolution: { w: number, h: number } | undefined) {
        if (GPU.context != null)
            return

        const screen = window.screen
        GPU.internalResolution.w = mainResolution?.w || screen.width
        GPU.internalResolution.h = mainResolution?.h || screen.height

        gpu = canvas.getContext("webgl2", {
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

        initializeFrameBuffers()
        await initializeStaticMeshes()
        initializeShaders()

        SceneRenderer.initialize()
        EntityWorkerAPI.initialize()
        TerrainGenerator.initialize()
        ImageProcessor.initialize()
        Material.initialize()

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