import Camera from "./utils/entities/Camera";

import cameraEvents from "./utils/components/cameraEvents";
import ScreenSpace from "./postprocessing/entities/ScreenSpace";
import ShadowMap from "./lights/components/ShadowMap";
import PostProcessing from "./postprocessing/entities/PostProcessing";
import Skybox from "./lights/entities/Skybox";
import GBuffer from "./postprocessing/entities/GBuffer";

export default class Renderer {
    currentFrame = 0
    fps = 0
    times = []
    canRender = true
    screenSpace
    shadowMap
    postProcessing
    gBuffer

    constructor(id, type, gpu) {
        this.gBuffer = new GBuffer(gpu)
        // this.screenSpace = new ScreenSpace(gpu)
        this.shadowMap = new ShadowMap(2048, gpu)
        this.postProcessing = new PostProcessing(gpu)

        this.performanceTarget = document.getElementById(id + '-frames')
        this.camera = new Camera(`${id}-canvas`, [0, 10, 30], 1.57, 1, 2000, 1, type)
        this.cameraEvents = cameraEvents(this.camera)
    }

    start(renderingProps) {
        // const renderingProps = {...r, skybox:  this.skybox}

        if (this.fps === 0 && this.performanceTarget) {
            const innerFPS = parseInt(this.performanceTarget.innerText)
            if (!isNaN(innerFPS))
                this.fps = innerFPS
        }
        this.canRender = true

        this.cameraEvents.stopTracking()
        this.camera.aspectRatio = renderingProps.gpu.canvas.width / renderingProps.gpu.canvas.height
        this.camera.updateProjectionMatrix()
        this.cameraEvents.startTracking()

        const callback = () => {
            let start = performance.now()

            this.shadowMapRenderPass(renderingProps)
            this.gBufferRenderPass(renderingProps)
            this.postProcessingRenderPass(renderingProps)

            while (this.times.length > 0 && this.times[0] <= start - 1000) {
                this.times.shift();
            }
            this.times.push(start);
            this.fps = this.times.length;
            if (this.performanceTarget)
                this.performanceTarget.innerText = `${this.fps}`

            if (this.canRender)
                this.currentFrame = requestAnimationFrame(callback);
        }
        this.currentFrame = requestAnimationFrame(callback);
    }
    stop() {
        this.canRender = false
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this.currentFrame)
    }

    gBufferRenderPass(renderingProps){

        this.gBuffer.startMapping() // Start rendering to textures
        this._meshRenderPass({
            ...renderingProps,
            skyboxTexture: renderingProps.skybox.texture,
            prevFrame: this.postProcessing.frameBufferTexture
        })
        this.gBuffer.stopMapping()

    }

    postProcessingRenderPass(renderingProps){
        this.postProcessing.startMapping()

        if (renderingProps.skybox){
            const ntVm = this.camera.getNotTranslatedViewMatrix()

            renderingProps.gpu.depthMask(false)
            renderingProps.shaders.skybox.use()
            renderingProps.skybox.draw(
                renderingProps.shaders.skybox,
                this.camera.projectionMatrix,
                ntVm
            )
            renderingProps.gpu.depthMask(true)
        }


        // G-BUFFER DRAW
        renderingProps.shaders.deferredShader.use()
        renderingProps.shaders.deferredShader.bindUniforms({
            irradianceMap: renderingProps.skybox.irradianceMap,
            skyboxTexture: renderingProps.skyboxTexture,
            lights: renderingProps.lights,
            shadowMapResolution: this.shadowMap.width,
            directionalLight: renderingProps.skybox.lightSource,
            shadowMapTexture: this.shadowMap.frameBufferTexture,

            gNormalTexture: this.gBuffer.gNormalTexture,
            gPositionTexture: this.gBuffer.gPositionTexture,
            gAlbedo: this.gBuffer.gAlbedo,
            gBehaviorTexture: this.gBuffer.gBehaviorTexture,
            gDepthTexture: this.gBuffer.gDepthTexture,
            cameraVec: this.camera.position
        })

        this.gBuffer.draw(renderingProps.shaders.deferredShader)


        // CLONE DEPTH BUFFER
        renderingProps.gpu.bindFramebuffer(renderingProps.gpu.READ_FRAMEBUFFER, this.gBuffer.gBuffer)
        renderingProps.gpu.bindFramebuffer(renderingProps.gpu.DRAW_FRAMEBUFFER, this.postProcessing.frameBufferObject)
        renderingProps.gpu.blitFramebuffer(
            0, 0,
            this.gBuffer.width, this.gBuffer.height,
            0, 0,
            this.postProcessing.width,this.postProcessing.height,
            renderingProps.gpu.DEPTH_BUFFER_BIT, renderingProps.gpu.NEAREST)
        renderingProps.gpu.bindFramebuffer(renderingProps.gpu.FRAMEBUFFER, this.postProcessing.frameBufferObject)

        this.miscRenderPass(renderingProps)


        this.postProcessing.stopMapping()
        renderingProps.shaders.postProcessing.use()
        this.postProcessing.draw(renderingProps.shaders.postProcessing)

    }
    _meshRenderPass({instances, meshes, gpu, materials, shaders}) {
        shaders.mesh.use()
        gpu.stencilMask(0xff)
        gpu.stencilFunc(gpu.ALWAYS, 1, 0xff)
        gpu.enable(gpu.DEPTH_TEST)

        for (let m = 0; m < instances.length; m++) {
            const mesh = meshes[instances[m].meshIndex]
            if (mesh.visible)
                instances[m].draw(
                    {
                        shader: shaders.mesh,
                        mesh,
                        cameraPosition: this.camera.position,
                        viewMatrix: this.camera.viewMatrix,
                        projectionMatrix: this.camera.projectionMatrix,
                        material: materials[instances[m].materialIndex],

                    }
                )
        }
    }

    shadowMapRenderPass({instances, meshes, gpu, skybox, shaders}) {
        shaders.shadowMap.use()
        gpu.clearDepth(1);
        this.shadowMap.startMapping()
        for (let m = 0; m < instances.length; m++) {
            const mesh = meshes[instances[m].meshIndex]
            if (mesh.visible)
                instances[m].draw(
                    {
                        shader: shaders.shadowMap,
                        mesh,
                        directionalLight: skybox.lightSource,
                        cameraPosition: this.camera.position,
                        viewMatrix: skybox.lightSource.lightView,
                        projectionMatrix: skybox.lightSource.lightProjection
                    }
                )
        }
        this.shadowMap.stopMapping()
    }

    miscRenderPass({
                       instances,
                       meshes,
                       gpu,
                       materials,
                       skybox,
                       selectedElement,
                       shaders,
                       grid,
                       lights
                   }) {

        //GRID
        shaders.grid.use()
        grid.draw(shaders.grid, this.camera.viewMatrix, this.camera.projectionMatrix)

        // LIGHTS
        shaders.lightShader.use()
        lights.forEach(light => {
            light.draw({
                shader: shaders.lightShader,
                viewMatrix: this.camera.viewMatrix,
                projectionMatrix: this.camera.projectionMatrix
            })
        })
        skybox.lightSource.draw({
            shader: shaders.lightShader,
            viewMatrix: this.camera.viewMatrix,
            projectionMatrix: this.camera.projectionMatrix
        })

        // OUTLINE
        const selectedInstance = instances[selectedElement]
        if (selectedInstance) {
            const selectedMesh = meshes[selectedInstance.meshIndex]
            shaders.outline.use()
            gpu.stencilFunc(gpu.NOTEQUAL, 1, 0xff)
            gpu.stencilMask(0x00)
            gpu.disable(gpu.DEPTH_TEST)
            selectedInstance.draw(
                {
                    shader: shaders.outline,
                    mesh: selectedMesh,
                    material: materials[selectedInstance.materialIndex],
                    directionalLight: skybox.lightSource,
                    cameraPosition: this.camera.position,
                    viewMatrix: this.camera.viewMatrix,
                    projectionMatrix: this.camera.projectionMatrix
                }
            )
        }
    }

}