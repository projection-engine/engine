import cloneClass from "../utils/cloneClass";
import COMPONENTS from "./templates/COMPONENTS";
import toObject from "./utils/misc/toObject";
import MATERIAL_TYPES from "./templates/MATERIAL_TYPES";
import RootCamera from "./RootCamera";
import RenderingWrapper from "./ecs/systems/RenderingWrapper";

export default class RenderLoop {
    _currentFrame = 0
    rootCamera = new RootCamera()
    viewTarget = this.rootCamera


    constructor(gpu, resolutionScale = 1) {
        this.gpu = gpu
        this.wrapper = new RenderingWrapper(gpu, resolutionScale)

    }

    callback(systems, onBeforeRender, onWrap) {
        onBeforeRender()
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
        for (let s = 0; s < this.sortedSystems.length; s++) {
            systems[this.sortedSystems[s]]
                .execute({
                        ...this.params,
                        camera: this.viewTarget,
                        elapsed: performance.now() - this._startedOn,
                    },
                    systems,
                    this.data,
                    this.filteredEntities,
                    this.entitiesMap
                )
        }
        this.wrapper.execute({
                ...this.params,
                camera: this.viewTarget,
                elapsed: performance.now() - this._startedOn,
            },
            systems,
            this.data,
            this.filteredEntities,
            this.entitiesMap, onWrap)

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap));
    }

    start(systems, entities, materials, meshes, params, scripts = [], onBeforeRender = () => null, onWrap) {
        const filteredEntities = this.filteredEntities = (params.canExecutePhysicsAnimation ? entities.map(e => cloneClass(e)) : entities).filter(e => e.active)
        this.data = {
            pointLights: filteredEntities.filter(e => e.components[COMPONENTS.POINT_LIGHT]),
            spotLights: filteredEntities.filter(e => e.components[COMPONENTS.SPOT_LIGHT]),
            terrains: filteredEntities.filter(e => e.components[COMPONENTS.TERRAIN]),

            meshes: filteredEntities.filter(e => e.components[COMPONENTS.MESH]),
            skybox: filteredEntities.filter(e => e.components[COMPONENTS.SKYBOX] && e.active)[0]?.components[COMPONENTS.SKYBOX],
            directionalLights: filteredEntities.filter(e => e.components[COMPONENTS.DIRECTIONAL_LIGHT]),
            materials: toObject(materials),
            meshSources: toObject(meshes),
            skylight: filteredEntities.filter(e => e.components.SkylightComponent && e.active)[0]?.components[COMPONENTS.SKYLIGHT],
            cubeMaps: filteredEntities.filter(e => e.components.CubeMapComponent),
            scriptedEntities: toObject(filteredEntities.filter(e => e.components[COMPONENTS.SCRIPT])),
            scripts: toObject(scripts),
            cameras: filteredEntities.filter(e => e.components[COMPONENTS.CAMERA])
        }

        this.entitiesMap = toObject(entities)
        this.data.cubeMapsSources = toObject(this.data.cubeMaps)
        this.sortedSystems = Object.keys(systems).sort()


        this.viewTarget = params.camera ? params.camera : this.rootCamera
        this._startedOn = performance.now()
        this.params = {...params, entitiesLength: this.filteredEntities.length}

        const canvasRef = this.gpu.canvas
        this.resizeObs = new ResizeObserver(() => {

            if (canvasRef) {
                const bBox = canvasRef.getBoundingClientRect()
                this.viewTarget.aspectRatio = bBox.width / bBox.height
                this.viewTarget.updateProjection()
            }
        })
        this.resizeObs.observe(canvasRef)

        this._currentFrame = requestAnimationFrame(() => this.callback(systems, onBeforeRender, onWrap))
    }

    stop() {
        this.resizeObs?.disconnect()
        cancelAnimationFrame(this._currentFrame)
    }
}