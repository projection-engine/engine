import {useEffect, useState} from "react";
import ShadowMap from "./renderer/buffers/ShadowMap";
import DepthMapShader from "./renderer/shaders/framebuffer/DepthMapShader";
import ShadowMapShader from "./renderer/shaders/framebuffer/ShadowMapShader";
import SkyBoxShader from "./renderer/shaders/skybox/SkyBoxShader";
import MeshShader from "./renderer/shaders/mesh/MeshShader";
import OutlineShader from "./renderer/shaders/mesh/OutlineShader";
import GridShader from "./renderer/shaders/grid/GridShader";
import PostProcessing from "./renderer/buffers/PostProcessing";

import useObjects from "./useObjects";

import Grid from "./renderer/misc/Grid";
import {enableBasics} from "./utils/utils";
import Renderer from "./renderer/Renderer";
import LightShader from "./renderer/shaders/light/LightShader";
import PostProcessingShader from "./renderer/shaders/framebuffer/PostProcessingShader";

export default function useEngine(id, cameraType) {

    const [shaders, setShaders] = useState({})
    const [keepExecution, setKeepExecution] = useState(true)
    const [gpu, setGpu] = useState()
    const [selectedElement, setSelectedElement] = useState(null)

    // BUFFERS
    const [shadowMap, setShadowMap] = useState({})
    const [gBuffer, setGBuffer] = useState({})
    const [postProcessing, setPostProcessing] = useState({})
    const [grid, setGrid] = useState({})

    let mainRenderer
    const {
        hierarchy, dispatchHierarchy,
        skybox, setSkybox,
        lights, setLights,
        meshes, setMeshes,
        instances, ready,
        setInstances, materials, setMaterials
    } = useObjects(gpu)


    useEffect(() => {
        const newGPU = document.getElementById(id + '-canvas').getContext('webgl2')


        setShadowMap(new ShadowMap(2048, newGPU))
        setPostProcessing(new PostProcessing(newGPU))

        setShaders({
            shadowMap: new ShadowMapShader(newGPU),
            skybox: new SkyBoxShader(newGPU),
            mesh: new MeshShader(newGPU),
            outline: new OutlineShader(newGPU),
            grid: new GridShader(newGPU),
            depthMap: new DepthMapShader(newGPU),
            postProcessing: new PostProcessingShader(newGPU),
            lightShader: new LightShader(newGPU)
        })

        setGrid(new Grid(newGPU))
        enableBasics(newGPU)
        setGpu(newGPU)

    }, [])


    useEffect(() => {
        if (!mainRenderer)
            mainRenderer = new Renderer(id, cameraType)
        if (ready && gpu && mainRenderer && keepExecution)
            mainRenderer?.start({
                meshes,
                gpu, materials,
                skybox,
                selectedElement,
                shaders, shadowMap, grid,
                instances,
                postProcessing,
                gBuffer,
                lights
            })
        return () => {
            if (mainRenderer !== undefined)
                mainRenderer?.stop()
        }
    }, [
        mainRenderer,
        instances,
        gpu,
        lights,
        keepExecution,
        ready,
        shadowMap,
        postProcessing
    ])

    return {
        ready,
        meshes, setMeshes,
        lights,
        setLights,
        gpu, materials, setMaterials,
        keepExecution, setKeepExecution,
        skybox, setSkybox,
        selectedElement, setSelectedElement,
        setPostProcessing,
        hierarchy, dispatchHierarchy,
        setInstances, instances
    }
}