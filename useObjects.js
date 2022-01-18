import {useEffect, useReducer, useState} from "react";
import Skybox from "./renderer/lights/entities/Skybox";

import hierarchyReducer, {ACTIONS} from "../components/scene/hierarchy/hierarchyReducer";
import Folder from "../components/scene/hierarchy/Folder";
import Actor from '../components/scene/hierarchy/Actor'
import {TYPES} from "../components/scene/hierarchy/TYPES";
import PointLight from "./renderer/lights/components/PointLight";
import PBR from "./renderer/mesh/components/PBR";

export default function useObjects(gpu) {
    const [ready, setReady] = useState(false)
    const [hierarchy, dispatchHierarchy] = useReducer(hierarchyReducer, []);

    // SCENE
    const [skybox, setSkybox] = useState(null)
    const [lights, setLights] = useState([])

    // MESHES / INSTANCES
    const [meshes, setMeshes] = useState([])
    const [instances, setInstances] = useState([])

    const [materials, setMaterials] = useState([])

    useEffect(() => {
        if (gpu !== undefined && gpu !== null) {

            // FOLDERS
            const root = new Folder('Editor')
            const meshesFolder = new Folder('Meshes', root.id)
            const sceneFolder = new Folder('Scene', root.id)
            setMaterials([
                new PBR(
                    gpu,
                    './metal/albedo.png',
                    './metal/metallic.png',
                    './metal/roughness.png',
                    './metal/normal.png',
                    undefined,
                    // './textures/ao.png',
                )])
            dispatchHierarchy({type: ACTIONS.PUSH, payload: root})
            dispatchHierarchy({type: ACTIONS.PUSH, payload: meshesFolder})
            dispatchHierarchy({type: ACTIONS.PUSH, payload: sceneFolder})
            dispatchHierarchy({
                type: ACTIONS.PUSH,
                payload: new Actor('Skybox', undefined, undefined, sceneFolder.id, TYPES.SKYBOX)
            })

            // DEBUG
            const pA = new PointLight(gpu, undefined, undefined, [0, 10, 25]),
                pB = new PointLight(gpu, undefined, undefined, [-10, 10, 25])

            setLights([pA, pB])

            dispatchHierarchy({
                type: ACTIONS.PUSH,
                payload: new Actor('Point Light A', undefined, 0, sceneFolder.id, TYPES.POINT_LIGHT)
            })
            dispatchHierarchy({
                type: ACTIONS.PUSH,
                payload: new Actor('Point Light B', undefined, 1, sceneFolder.id, TYPES.POINT_LIGHT)
            })

            setSkybox(new Skybox(gpu, './skybox2.png'))
            setReady(true)
        }
    }, [gpu])

    return {
        skybox, setSkybox,
        lights, setLights,
        instances,
        meshes, setMeshes,
        ready, setInstances,
        hierarchy, dispatchHierarchy, materials, setMaterials
    }
}
