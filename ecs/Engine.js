import TranslationGizmo from "../gizmo/TranslationGizmo";
import cameraEvents from "../renderer/elements/cameraEvents";
import Camera from "../renderer/elements/Camera";

export default class Engine {
    types = {}
    data = {
        fpsTarget: undefined,
        currentCoord: {x: 0, y: 0},
        currentFrame: 0,
        fps: 0,
        times: [],
        clicked: false,
        canRender: true,
        performanceRef: undefined,
        canvasRef: undefined
    }
    utils = {
        postProcessing: undefined,
        translationGizmo: undefined,
    }


    constructor(id, type, gpu, fpsTarget) {
        this.data.canvasRef = document.getElementById(id + '-canvas')
        this.data.fpsTarget = fpsTarget
        this.gpu = gpu


        this.utils.translationGizmo = new TranslationGizmo(this.gpu)

        this.data.performanceRef = document.getElementById(id + '-frames')
        this.camera = new Camera(`${id}-canvas`, [0, 10, 30], 1.57, 1, 2000, 1, type)
        this.cameraEvents = cameraEvents(this.camera, (x, y) => {
            this.data.clicked = true
            this.data.currentCoord = {x, y}
        })

    }

    updateParams(params, entities,materials,meshes) {
        console.log(materials,meshes)
        let r = {
            pointLights: {},
            spotLights: {},
            meshes: {},
            skyboxes: {},
            grid: {},
            directionalLights: {},
            materials: {},
            meshSources: {}
        }

        for (let i = 0; i < entities.length; i++) {
            const current = entities[i]
            if (current.components.PointLightComponent)
                r.pointLights[current.id] = i
            if (current.components.SpotLightComponent)
                r.spotLights[current.id] = i
            if (current.components.DirectionalLightComponent)
                r.directionalLights[current.id] = i

            if (current.components.SkyboxComponent)
                r.skyboxes[current.id] = i
            if (current.components.GridComponent)
                r.grid[current.id] = i
            if (current.components.MeshComponent)
                r.meshes[current.id] = i
        }
        for(let i = 0; i< materials.length; i++){
            r.materials[materials[i].id] = i
        }

        for(let i = 0; i< meshes.length; i++){

            r.meshSources[meshes[i].id] = i
        }

        this.types = r

        this.params = {
            ...params,
            currentCoord: this.data.currentCoord,
            clicked: this.data.clicked,
            camera: this.camera,
        }



        this.cameraEvents.stopTracking()
        this.camera.aspectRatio = this.gpu.canvas.width / this.gpu.canvas.height
        this.camera.updateProjectionMatrix()

    }

    start(entities, systems) {
        this.data.canRender = true
        this.cameraEvents.startTracking()

        const callback = () => {
            let start = performance.now()
            this.camera.updatePlacement()

            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)

            systems.forEach((s,i) => {
                s.execute(
                    entities,
                    this.params,
                    systems,
                    this.types
                )
            })

            while (this.data.times.length > 0 && this.data.times[0] <= start - 1000) {
                this.data.times.shift();
            }
            this.data.times.push(start);
            this.data.fps = this.data.times.length;
            if (this.data.performanceRef)
                this.data.performanceRef.innerText = `${this.data.fps}`

            if (this.data.canRender)
                this.data.currentFrame = requestAnimationFrame(callback);
        }
        this.data.currentFrame = requestAnimationFrame(callback);
    }

    stop() {
        this.data.canRender = false
        this.cameraEvents.stopTracking()
        cancelAnimationFrame(this.data.currentFrame)
    }


}