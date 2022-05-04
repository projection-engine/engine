import Renderer from "../Renderer";
import CAMERA_TYPES from "./camera/CAMERA_TYPES";
import toObject from "../utils/toObject";
import PickSystem from "../systems/PickSystem";
import SYSTEMS from "../templates/SYSTEMS";
import {STEPS_CUBE_MAP} from "../systems/CubeMapSystem";
import COMPONENTS from "../templates/COMPONENTS";
import EditorCameras from "./EditorCameras";
import getSystemKey from "../utils/getSystemKey";
import EditorWrapper from "./EditorWrapper";

export default class EditorEngine extends Renderer {
    _systems = {}
    recompiled = false


    gizmo
    cameraData = {}

    constructor(id, gpu, resolution) {
        super(gpu, resolution);
        this.id = id
        this.gpu = gpu
        this.cameraData = new EditorCameras(id, CAMERA_TYPES.SPHERICAL, document.getElementById(id + '-canvas'))

        this.initialized = true
        this.editorSystem = new EditorWrapper(gpu,)
    }

    get camera() {
        return this.cameraData.camera
    }

    set camera(data) {
        this.cameraData.camera = data
    }

    get canvas() {
        return this.gpu.canvas
    }


    set systems(data) {
        let newSystems = {}
        data.forEach(s => {
            let key = getSystemKey(s)

            if (key)
                newSystems[key] = s
        })
        this._systems = newSystems
    }

    get systems() {
        return this._systems
    }

    refreshCubemaps() {
        this._systems[SYSTEMS.CUBE_MAP].step = STEPS_CUBE_MAP.BASE
    }

    updatePackage(entities, materials, meshes, params, scripts = [], onGizmoStart, onGizmoEnd) {

        if (!params.canExecutePhysicsAnimation)
            this.cameraData.cameraEvents.startTracking()
        else
            this.cameraData.cameraEvents.stopTracking()
        this._changed = true
        const camera = params.canExecutePhysicsAnimation ? this.rootCamera : this.camera

        const meshSources = toObject(meshes)
        if (typeof params.setSelected === 'function')
            this.cameraData.onClick = (currentCoords, ctrlKey) => {
                const p = this._systems[SYSTEMS.PICK]
                const index = p.pickElement((shader, proj) => {
                    for (let m = 0; m < entities.length; m++) {
                        const currentInstance = entities[m]
                        if (entities[m].active) {
                            const t = currentInstance.components[COMPONENTS.TRANSFORM]
                            if (currentInstance.components[COMPONENTS.MESH]) {
                                const mesh = meshSources[currentInstance.components[COMPONENTS.MESH]?.meshID]
                                if (mesh !== undefined)
                                    PickSystem.drawMesh(mesh, currentInstance, camera.viewMatrix, proj, t.transformationMatrix, shader, this.gpu)
                            } else if (t)
                                PickSystem.drawMesh(currentInstance.components[COMPONENTS.CAMERA] ? p.cameraMesh : p.mesh, currentInstance, camera.viewMatrix, proj, t.transformationMatrix, shader, this.gpu)
                        }
                    }
                }, currentCoords, camera)
                if (index > 0) {
                    const entity = entities.find(e => e.components[COMPONENTS.PICK]?.pickID[0] * 255 === index)
                    if (entity)
                        params.setSelected(prev => {
                            const i = prev.findIndex(e => e === entity.id)
                            if (i > -1) {
                                prev.splice(i, 1)
                                return prev
                            }
                            if (ctrlKey)
                                return [...prev, entity.id]
                            else
                                return [entity.id]
                        })
                } else
                    params.setSelected([])
            }

        super.updatePackage(
            this._systems,
            entities,
            materials,
            meshes,
            {
                ...params,
                onGizmoStart,
                onGizmoEnd,
                camera,
                lockCamera: (lock) => {
                    if (lock) {
                        this.cameraData.cameraEvents.stopTracking()
                    } else
                        this.cameraData.cameraEvents.startTracking()
                },
                dataChanged: this._changed,
                setDataChanged: () => this._changed = false,
                gizmo: this.gizmo
            },
            scripts,
            () => this.camera.updatePlacement(),
            this.editorSystem
        )

        this.start()

    }

    stop() {
        super.stop()
        this.cameraData.cameraEvents.stopTracking()
    }

    get cameraType() {
        return this.cameraData.cameraType
    }

    set cameraType(data) {
        this.cameraData.cameraType = data
        this.cameraData.changeCamera(data)
    }
}

