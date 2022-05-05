import {useContext, useEffect, useMemo, useState} from "react";

import useEngineEssentials, {ENTITY_ACTIONS} from "./useEngineEssentials";
import Entity from "../basic/Entity";


import EditorEngine from "../editor/EditorEngine";
import DirectionalLightComponent from "../components/DirectionalLightComponent";

import MeshComponent from "../components/MeshComponent";
import TransformComponent from "../components/TransformComponent";
import MeshInstance from "../instances/MeshInstance";

import {SHADING_MODELS} from "../../pages/project/hooks/useSettings";
import CAMERA_TYPES from "../editor/camera/CAMERA_TYPES";
import MaterialComponent from "../components/MaterialComponent";

import {v4 as uuidv4} from 'uuid';
import COMPONENTS from "../templates/COMPONENTS";
import LoaderProvider from "../../components/loader/LoaderProvider";
import QuickAccessProvider from "../../pages/project/hooks/QuickAccessProvider";
import SYSTEMS from "../templates/SYSTEMS";

const id = uuidv4().toString()
export default function useMinimalEngine(initializeSphere, centerOnSphere, loadAllMeshes) {
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        gpu
    } = useEngineEssentials(id + '-canvas')
    const quickAccess = useContext(QuickAccessProvider)
    const [canRender, setCanRender] = useState(true)
    const load = useContext(LoaderProvider)

    const renderer = useMemo(() => {
        if (gpu) {
            const r = new EditorEngine(id, gpu, {w: window.screen.width, h: window.screen.height}, SYSTEMS.MESH)
            if (quickAccess.sampleSkybox)
                dispatchEntities({
                    type: ENTITY_ACTIONS.ADD,
                    payload: quickAccess.sampleSkybox
                })
            initializeLight(dispatchEntities)

            if (initializeSphere)
                import('../editor/assets/Sphere.json').then(sphereMesh => {
                    initializeMesh(sphereMesh.value, gpu, IDS.SPHERE, 'Sphere', dispatchEntities, setMeshes)
                })
            if (loadAllMeshes)
                import('../editor/assets/Cube.json')
                    .then(cubeData => initializeMesh(cubeData, gpu, IDS.CUBE, 'Sphere', dispatchEntities, setMeshes, undefined, true))

            return r
        }
        return undefined
    }, [gpu])
    useEffect(() => {
        if (canRender && renderer) {
            renderer.start()
        } else if (renderer)
            renderer.stop()
    }, [canRender])
    useEffect(() => {
        if (renderer) {

            renderer.updatePackage(entities, materials, meshes, {
                fxaa: true,
                meshes,
                gamma: 2.2,
                exposure: 1,
                materials: [],
                noRSM: true,
                shadingModel: SHADING_MODELS.DETAIL,
                cameraType: CAMERA_TYPES.SPHERICAL,
                bloom: true,
                filmGrain: true,
                filmGrainStrength: .07,
                bloomStrength: .1,
                bloomThreshold: .75
            })

        }
        return () => renderer?.stop()
    }, [
        meshes,
        materials,
        entities,
        gpu,
        id,
        renderer,
        canRender
    ])


    return {
        id, load,
        entities, dispatchEntities,
        meshes, setMeshes, gpu,
        material: materials[0], setMaterial: mat => setMaterials([mat]),
        renderer,
        canRender, setCanRender,
        toImage: () => new Promise(re => re(gpu.canvas.toDataURL()))
    }
}


function initializeLight(dispatch) {
    const newEntity = new Entity(undefined, 'light')
    const light = new DirectionalLightComponent()
    light.direction = [0, 100, 100]
    newEntity.components[COMPONENTS.DIRECTIONAL_LIGHT] = light
    dispatch({
        type: ENTITY_ACTIONS.ADD,
        payload: newEntity
    })
}

export function initializeMesh(data, gpu, id, name, dispatch, setMeshes, noTranslation, noEntity) {
    let mesh = new MeshInstance({
        ...data,
        id: id,
        gpu: gpu,

    })
    setMeshes(prev => [...prev, mesh])
    if (!noEntity) {
        const newEntity = new Entity(id, name)
        const transformation = new TransformComponent()

        transformation.scaling = data.scaling
        transformation.rotation = data.rotation
        if (!noTranslation)
            transformation.translation = data.translation

        if (id === IDS.SPHERE)
            transformation.translation = [0, 1, 0]
        newEntity.components.MeshComponent = new MeshComponent(undefined, mesh.id)
        newEntity.components.TransformComponent = transformation
        newEntity.components.MaterialComponent = new MaterialComponent(undefined, id === IDS.PLANE ? undefined : IDS.MATERIAL, id === IDS.PLANE)

        dispatch({
            type: ENTITY_ACTIONS.ADD,
            payload: newEntity
        })
    }
}

export const IDS = {
    MATERIAL: '1',
    SPHERE: 'SPHERE-0',
    PLANE: 'PLANE-0',
    TARGET: 'TARGET',
    CUBE: 'CUBE-0'
}