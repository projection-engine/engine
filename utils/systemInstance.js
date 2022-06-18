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

export default function systemInstance(s, gpu, resolution, projectID) {
    switch (true) {

    case s  === SYSTEMS.AO:
        return new AOSystem(gpu, resolution)
    case s  === SYSTEMS.CULLING:
        return new CullingSystem(gpu)
    case s  === SYSTEMS.MESH:
        return new Deferred(gpu, resolution)
    case s  === SYSTEMS.PERF:
        return new MetricsSystem(gpu, gpu.canvas.id)
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
    case s  === SYSTEMS.PROBE:
        return new LightProbeSystem(gpu)
    case s  === SYSTEMS.SCRIPT:
        return new ScriptSystem(gpu, gpu.canvas.id, projectID)
    case s  === SYSTEMS.DEPTH_PRE_PASS:
        return new DepthSystem(gpu, resolution)
    case s  === SYSTEMS.LINE:
        return new LineSystem(gpu)
    case s  === SYSTEMS.SSGI:
        return new SSR(gpu, resolution)
    default:
        return undefined
    }
}
