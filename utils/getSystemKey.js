import CameraCubeSystem from "../ecs/systems/CameraCubeSystem";
import SYSTEMS from "../templates/SYSTEMS";
import AOSystem from "../ecs/systems/AOSystem";
import CullingSystem from "../ecs/systems/CullingSystem";
import GBufferSystem from "../ecs/systems/GBufferSystem";
import PerformanceSystem from "../ecs/systems/PerformanceSystem";
import PhysicsSystem from "../ecs/systems/PhysicsSystem";
import PickSystem from "../ecs/systems/PickSystem";

import ShadowMapSystem from "../ecs/systems/ShadowMapSystem";
import TransformSystem from "../ecs/systems/TransformSystem";
import CubeMapSystem from "../ecs/systems/CubeMapSystem";
import ForwardSystem from "../ecs/systems/ForwardSystem";
import DeferredSystem from "../ecs/systems/DeferredSystem";
import ScriptSystem from "../ecs/systems/ScriptSystem";

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
