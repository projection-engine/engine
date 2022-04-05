import {useReducer, useState} from "react";
import entityReducer from "../utils/entityReducer";

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
