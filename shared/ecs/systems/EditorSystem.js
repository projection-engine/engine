import System from "../basic/System";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SYSTEMS from "../../templates/SYSTEMS";
import GizmoSystem from "./subsystems/GizmoSystem";
import SelectedSystem from "./subsystems/SelectedSystem";


export default class EditorSystem extends System {
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
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,
            skylight,
            translucentMeshes,
            cameras
        } = data
        const {
            lockCamera,
            setSelected,
            selected,
            camera,
            typeRendering,
            iconsVisibility,
            gridVisibility,
            shadingModel,
            noRSM,
            gamma,
            exposure,
            rotationType,
            onGizmoStart,
            onGizmoEnd,
            gizmo,
            canExecutePhysicsAnimation,
            gridSize
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
                this.gizmoSystem.execute(
                    meshes,
                    meshSources,
                    selected,
                    camera,
                    systems[SYSTEMS.PICK],
                    lockCamera,
                    entities,
                    gizmo,
                    rotationType,
                    onGizmoStart,
                    onGizmoEnd,
                    gridSize
                )
                this.selectedSystem.execute(selected, meshSources, camera, entitiesMap)
            }
        }

    }
}