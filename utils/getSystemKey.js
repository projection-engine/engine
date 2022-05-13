import CameraCubeSystem from "../../engine-editor/systems/CameraCubeSystem";
import SYSTEMS from "../templates/SYSTEMS";
import CullingSystem from "../systems/CullingSystem";
import GBufferSystem from "../systems/GBufferSystem";
import PerformanceSystem from "../systems/PerformanceSystem";
import PickSystem from "../systems/PickSystem";

import ShadowMapSystem from "../systems/ShadowMapSystem";
import TransformSystem from "../systems/TransformSystem";
import CubeMapSystem from "../systems/CubeMapSystem";
import ScriptSystem from "../systems/ScriptSystem";
import DepthSystem from "../systems/DepthSystem";
import AOSystem from "../systems/AOSystem";

export default function getSystemKey(s, gpu, resolution) {
    switch (true) {
        case s  === SYSTEMS.CAMERA_CUBE:
            return  new CameraCubeSystem(gpu.canvas.id)
        case s  === SYSTEMS.AO:
            return new AOSystem(gpu, resolution)
        case s  === SYSTEMS.CULLING:
            return new CullingSystem(gpu)
        case s  === SYSTEMS.MESH:
            return new GBufferSystem(gpu, resolution)
        case s  === SYSTEMS.PERF:
            return new PerformanceSystem(gpu, gpu.canvas.id)
        case s  === SYSTEMS.PHYSICS:
            return undefined
        case s  === SYSTEMS.PICK:
            return new PickSystem(gpu)
        case s  === SYSTEMS.SHADOWS:
            return new ShadowMapSystem(gpu)
        case s  === SYSTEMS.TRANSFORMATION:
            return new TransformSystem()
        case s  === SYSTEMS.CUBE_MAP:
            return new CubeMapSystem(gpu)
        case s  === SYSTEMS.SCRIPT:
            return new ScriptSystem(gpu, gpu.canvas.id)

        case s  === SYSTEMS.DEPTH_PRE_PASS:
            return new DepthSystem(gpu, resolution)
        default:
            return undefined
    }
}
