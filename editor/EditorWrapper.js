import System from "../basic/System";
import GridSystem from "./systems/GridSystem";
import BillboardSystem from "./systems/BillboardSystem";
import SYSTEMS from "../templates/SYSTEMS";
import GizmoSystem from "./systems/GizmoSystem";
import SelectedSystem from "./systems/SelectedSystem";


export default class EditorWrapper extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.gizmoSystem = new GizmoSystem(gpu)
        this.selectedSystem = new SelectedSystem(gpu)
    }

    execute(options, systems, data, entities, entitiesMap, after) {
        super.execute()
        const {
            pointLights,
            spotLights,
            meshes,
            directionalLights,
            meshSources,
            cubeMaps,
            skylight,
            cameras
        } = data
        const {
            lockCamera,
            selected,
            camera,
            iconsVisibility,

            rotationType,
            onGizmoStart,
            onGizmoEnd,
            gizmo,
            canExecutePhysicsAnimation,

            gridSize,
            gridRotationSize,
            gridScaleSize
        } = options

        if(!after) {
            this.gpu.disable(this.gpu.DEPTH_TEST)
            this.gridSystem.execute(options)
            this.gpu.enable(this.gpu.DEPTH_TEST)
        }
        else {
            this.gpu.enable(this.gpu.BLEND)
            this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA)
            if (!canExecutePhysicsAnimation) {
                this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility, skylight, cameras)
            }
            if (gizmo !== undefined && !canExecutePhysicsAnimation) {
                this.selectedSystem.execute(selected, meshSources, camera, entitiesMap)
                this.gizmoSystem.execute(
                    meshes,
                    meshSources,
                    selected,
                    camera,
                    systems[SYSTEMS.PICK],
                    lockCamera,
                    entitiesMap,
                    gizmo,
                    rotationType,
                    onGizmoStart,
                    onGizmoEnd,
                    gridSize,
                    gridRotationSize,
                    gridScaleSize
                )

            }
        }

    }
}