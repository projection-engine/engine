import {useEffect, useMemo, useState} from "react";
import TransformSystem from "../ecs/systems/TransformSystem";
import ShadowMapSystem from "../ecs/systems/ShadowMapSystem";
import PickSystem from "../ecs/systems/PickSystem";
import EditorEngine from "../editor/EditorEngine";
import PerformanceSystem from "../ecs/systems/PerformanceSystem";
import CubeMapSystem from "../ecs/systems/CubeMapSystem";
import useEngineEssentials, {ENTITY_ACTIONS} from "./useEngineEssentials";
import useHistory from "../../pages/project/hooks/useHistory";
import {HISTORY_ACTIONS} from "../../pages/project/hooks/historyReducer";
import COMPONENTS from "../templates/COMPONENTS";
import CameraCubeSystem from "../ecs/systems/CameraCubeSystem";
import ScriptSystem from "../ecs/systems/ScriptSystem";


export default function useEditorEngine(id, canExecutePhysicsAnimation, settings, load, canStart, setAlert) {
    const [canRender, setCanRender] = useState(true)
    const [selected, setSelected] = useState([])
    const [lockedEntity, setLockedEntity] = useState()
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        scripts, setScripts,
        gpu
    } = useEngineEssentials(id + '-canvas')
    const {returnChanges, forwardChanges, dispatchChanges} = useHistory(entities, dispatchEntities, setAlert)


    const renderer = useMemo(() => {
        if (gpu && canStart) {
            const r = new EditorEngine(id, gpu, {w: settings.resolution[0], h: settings.resolution[1]})
            r.systems = [
                new ScriptSystem(gpu),
                new PerformanceSystem(gpu),
                new TransformSystem(),
                new ShadowMapSystem(gpu),
                new PickSystem(gpu),
                new CameraCubeSystem(id + '-camera'),
                new CubeMapSystem(gpu),
            ]
            return r
        }
        return undefined
    }, [gpu, canStart])
    useEffect(() => {
        if (canRender && renderer) {
            renderer.start()
        } else if (renderer)
            renderer.stop()
    }, [canRender])

    const onGizmoStart = () => {
        const e = entities.find(e => e.id === selected[0])
        if (e)
            dispatchChanges({
                type: HISTORY_ACTIONS.SAVE_COMPONENT_STATE,
                payload: {
                    key: COMPONENTS.TRANSFORM,
                    entityID: selected[0],
                    component: e.components[COMPONENTS.TRANSFORM]
                }
            })
    }
    const onGizmoEnd = () => {
        const e = entities.find(e => e.id === selected[0])
        if (e)
            dispatchEntities({
                type: ENTITY_ACTIONS.UPDATE_COMPONENT,
                payload: {key: COMPONENTS.TRANSFORM, entityID: selected[0], data: e.components[COMPONENTS.TRANSFORM]}
            })
    }
    useEffect(() => {
        if (renderer && canStart) {
            renderer.cameraType = settings.cameraType
            renderer.gizmo = settings.gizmo
            renderer.camera.fov = settings.fov
            renderer?.updatePackage(

                entities,
                materials,
                meshes,
                {canExecutePhysicsAnimation, selected, setSelected, ...settings},
                scripts,
                onGizmoStart,
                onGizmoEnd
            )
        }

    }, [
        canExecutePhysicsAnimation,
        selected, setSelected,
        materials, meshes, scripts,
        entities, gpu, id,
        settings, canStart
    ])


    return {
        returnChanges, forwardChanges,
        dispatchChanges,
        lockedEntity, setLockedEntity,
        entities, dispatchEntities,
        meshes, setMeshes,
        gpu, materials, setMaterials,
        selected, setSelected,
        canRender, setCanRender,
        renderer,
        scripts, setScripts
    }
}
