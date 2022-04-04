import {useEffect, useReducer, useRef, useState} from "react";
import {enableBasics} from "./utils/misc/utils";
import entityReducer, {ENTITY_ACTIONS} from "../utils/entityReducer";
import PostProcessingSystem from "../engine/ecs/systems/PostProcessingSystem";
import MeshSystem from "../engine/ecs/systems/MeshSystem";
import TransformSystem from "../engine/ecs/systems/TransformSystem";
import PhysicsSystem from "../engine/ecs/systems/PhysicsSystem";
import ShadowMapSystem from "../engine/ecs/systems/ShadowMapSystem";
import PickSystem from "../engine/ecs/systems/PickSystem";
import Engine from "../engine/Engine";
import EVENTS from "../utils/misc/EVENTS";
import PerformanceSystem from "../engine/ecs/systems/PerformanceSystem";
import SYSTEMS from "../engine/templates/SYSTEMS";
import CubeMapSystem from "../engine/ecs/systems/CubeMapSystem";
import COMPONENTS from "../engine/templates/COMPONENTS";
import ScriptSystem from "../engine/ecs/systems/ScriptSystem";
import cloneClass from "../utils/misc/cloneClass";
export default function useEngineEssentials(keepChangeHistory) {
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [scripts, setScripts] = useState([])

    return {
        entities, dispatchEntities,
        meshes, setMeshes,
        materials, setMaterials,
        scripts, setScripts
    }
}
