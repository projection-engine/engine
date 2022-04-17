import CameraCubeSystem from "../shared/ecs/systems/utils/CameraCubeSystem";
import SYSTEMS from "../shared/templates/SYSTEMS";
import AOSystem from "../shared/ecs/systems/rendering/AOSystem";
import CullingSystem from "../shared/ecs/systems/utils/CullingSystem";
import GBufferSystem from "../shared/ecs/systems/rendering/GBufferSystem";
import PerformanceSystem from "../shared/ecs/systems/utils/PerformanceSystem";
import PhysicsSystem from "../shared/ecs/systems/utils/PhysicsSystem";
import PickSystem from "../shared/ecs/systems/utils/PickSystem";

import ShadowMapSystem from "../shared/ecs/systems/rendering/ShadowMapSystem";
import TransformSystem from "../shared/ecs/systems/utils/TransformSystem";
import CubeMapSystem from "../shared/ecs/systems/rendering/CubeMapSystem";
import ScriptSystem from "../shared/ecs/systems/utils/ScriptSystem";
import ForwardSystem from "../shared/ecs/systems/rendering/ForwardSystem";
import DeferredSystem from "../shared/ecs/systems/rendering/DeferredSystem";

export default function getSystemKey(s) {
    switch (true) {
        case s instanceof CameraCubeSystem:
            return SYSTEMS.CAMERA_CUBE
        case s instanceof AOSystem:
            return SYSTEMS.AO

        case s instanceof CullingSystem:
            return SYSTEMS.CULLING

        case s instanceof GBufferSystem:
            return SYSTEMS.MESH

        case s instanceof PerformanceSystem:
            return SYSTEMS.PERF

        case s instanceof PhysicsSystem:
            return SYSTEMS.PHYSICS

        case s instanceof PickSystem:
            return SYSTEMS.PICK


        case s instanceof ShadowMapSystem:
            return SYSTEMS.SHADOWS

        case s instanceof TransformSystem:
            return SYSTEMS.TRANSFORMATION

        case s instanceof CubeMapSystem:
            return SYSTEMS.CUBE_MAP
        case s instanceof ScriptSystem:
            return SYSTEMS.SCRIPT



        case s instanceof ForwardSystem:
            return SYSTEMS.SCRIPT
        case s instanceof DeferredSystem:
            return SYSTEMS.SCRIPT
        default:
            return undefined
    }
}
