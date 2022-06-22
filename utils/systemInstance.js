import SYSTEMS from "../templates/SYSTEMS"
import CullingSystem from "../systems/CullingSystem"
import Deferred from "../systems/Deferred"
import MetricsSystem from "../systems/MetricsSystem"
import PickSystem from "../systems/PickSystem"

import ShadowMapSystem from "../systems/ShadowMapSystem"
import TransformSystem from "../systems/TransformSystem"
import CubeMapSystem from "../systems/CubeMapSystem"
import ScriptSystem from "../systems/ScriptSystem"
import DepthSystem from "../systems/DepthSystem"
import AOSystem from "../systems/AOSystem"
import LightProbeSystem from "../systems/LightProbeSystem"
import LineSystem from "../systems/LineSystem"
import SSR from "../systems/SSR"

export default function systemInstance(s, resolution) {
    switch (true) {

    case s  === SYSTEMS.AO:
        return new AOSystem( resolution)
    case s  === SYSTEMS.CULLING:
        return new CullingSystem(resolution)
    case s  === SYSTEMS.MESH:
        return new Deferred(resolution)
    case s  === SYSTEMS.PERF:
        return new MetricsSystem(resolution)

    case s  === SYSTEMS.PICK:
        return new PickSystem(resolution)
    case s  === SYSTEMS.SHADOWS:
        return new ShadowMapSystem(resolution)
    case s  === SYSTEMS.TRANSFORMATION:
        return new TransformSystem(resolution)
    case s  === SYSTEMS.CUBE_MAP:
        return new CubeMapSystem(resolution)
    case s  === SYSTEMS.PROBE:
        return new LightProbeSystem(resolution)
    case s  === SYSTEMS.SCRIPT:
        return new ScriptSystem(resolution)
    case s  === SYSTEMS.DEPTH_PRE_PASS:
        return new DepthSystem(resolution)
    case s  === SYSTEMS.LINE:
        return new LineSystem(resolution)
    case s  === SYSTEMS.SSGI:
        return new SSR(resolution)
    default:
        return undefined
    }
}
