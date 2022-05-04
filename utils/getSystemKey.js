import CameraCubeSystem from "../systems/CameraCubeSystem";
import SYSTEMS from "../templates/SYSTEMS";
import AOSystem from "../systems/AOSystem";
import CullingSystem from "../systems/CullingSystem";
import GBufferSystem from "../systems/GBufferSystem";
import PerformanceSystem from "../systems/PerformanceSystem";
import PhysicsSystem from "../systems/PhysicsSystem";
import PickSystem from "../systems/PickSystem";

import ShadowMapSystem from "../systems/ShadowMapSystem";
import TransformSystem from "../systems/TransformSystem";
import CubeMapSystem from "../systems/CubeMapSystem";
import ForwardSystem from "../systems/ForwardSystem";
import DeferredSystem from "../systems/DeferredSystem";
import ScriptSystem from "../systems/ScriptSystem";

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
