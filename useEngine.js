import {useEffect, useState} from "react";
import {enableBasics} from "./utils/utils";
import useECS from "./useECS";

export default function useEngine(id) {
    const [keepExecution, setKeepExecution] = useState(true)
    const [gpu, setGpu] = useState()
    const [selectedElement, setSelectedElement] = useState(null)
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])

    useEffect(() => {
        if(id) {
            const newGPU = document.getElementById(id + '-canvas').getContext('webgl2', {
                antialias: false,
                preserveDrawingBuffer: true
            })
            enableBasics(newGPU)
            setGpu(newGPU)
        }
    }, [id])


    const {
        entities, dispatchEntities,
        systems, dispatchSystems,
        ready,
        currentCamera, setCurrentCamera
    } = useECS({
        meshes,
        selectedElement,
        setSelectedElement,
        materials
    }, id,  gpu)

    return {
        currentCamera, setCurrentCamera,
        ready,
        entities, dispatchEntities,
        systems, dispatchSystems,
        meshes, setMeshes,
        gpu, materials, setMaterials,
        keepExecution, setKeepExecution,
        selectedElement, setSelectedElement
    }
}
