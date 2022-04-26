import CameraCubeSystem from "../shared/ecs/systems/CameraCubeSystem";
import SYSTEMS from "../shared/templates/SYSTEMS";
import AOSystem from "../shared/ecs/systems/AOSystem";
import CullingSystem from "../shared/ecs/systems/CullingSystem";
import GBufferSystem from "../shared/ecs/systems/GBufferSystem";
import PerformanceSystem from "../shared/ecs/systems/PerformanceSystem";
import PhysicsSystem from "../shared/ecs/systems/PhysicsSystem";
import PickSystem from "../shared/ecs/systems/PickSystem";

import ShadowMapSystem from "../shared/ecs/systems/ShadowMapSystem";
import TransformSystem from "../shared/ecs/systems/TransformSystem";
import CubeMapSystem from "../shared/ecs/systems/CubeMapSystem";
import ScriptSystem from "../shared/ecs/systems/ScriptSystem";
import ForwardSystem from "../shared/ecs/systems/ForwardSystem";
import DeferredSystem from "../shared/ecs/systems/DeferredSystem";

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
