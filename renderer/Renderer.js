import Camera from "./misc/Camera";

import cameraEvents from "./misc/CameraEvents";
import ScreenSpace from "./buffers/ScreenSpace";
import ShadowMap from "./buffers/ShadowMap";
import PostProcessing from "./buffers/PostProcessing";
import Skybox from "./lights/Skybox";

export default class Renderer {
    currentFrame = 0
    fps = 0
    times = []
    canRender = true
    screenSpace
    shadowMap
    postProcessing

    constructor(id, type, gpu) {

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

            this.postProcessing.startMapping()
            if (renderingProps.skybox)
                this.skyboxRenderPass(renderingProps)
            this.miscRenderPass(renderingProps)
            this.meshRenderPass({
                ...renderingProps,
                skyboxTexture: renderingProps.skybox.texture,
                prevFrame: this.postProcessing.frameBufferTexture
            })

            this.postProcessing.stopMapping()
            renderingProps.shaders.postProcessing.use()
            this.postProcessing.draw(renderingProps.shaders.postProcessing)

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

    meshRenderPass({
                       instances, meshes,
                       gpu, materials,
                       skybox, skyboxTexture,

                       shaders, lights
                   }) {
        shaders.mesh.use()
        gpu.stencilMask(0xff)
        gpu.stencilFunc(gpu.ALWAYS, 1, 0xff)
        gpu.enable(gpu.DEPTH_TEST)

        for (let m = 0; m < instances.length; m++) {
            const mesh = meshes[instances[m].meshIndex]
            if (mesh.visible)
                instances[m].draw(
                    {
                        irradianceMap: skybox.irradianceMap,
                        skyboxTexture,
                        lights: lights,
                        shader: shaders.mesh,
                        mesh,
                        shadowMapResolution: this.shadowMap.width,
                        directionalLight: skybox.lightSource,
                        cameraPosition: this.camera.position,
                        viewMatrix: this.camera.viewMatrix,
                        projectionMatrix: this.camera.projectionMatrix,
                        material: materials[instances[m].materialIndex],
                        shadowMapTexture: this.shadowMap.frameBufferTexture
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

    skyboxRenderPass({
                         gpu,
                         skybox,
                         shaders,
                     }) {


        const ntVm = this.camera.getNotTranslatedViewMatrix()
        gpu.depthMask(false)
        shaders.skybox.use()
        skybox.draw(
            shaders.skybox,
            this.camera.projectionMatrix,
            ntVm
        )
        gpu.depthMask(true)


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