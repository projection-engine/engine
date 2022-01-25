import {useEffect, useReducer, useRef, useState} from "react";
import entityReducer, {ENTITY_ACTIONS} from "./utils/entityReducer";
import systemReducer, {SYSTEM_ACTIONS} from "./utils/systemReducer";
import Engine from "./Engine";
import DeferredSystem from "./systems/DeferredSystem";
import PickSystem from "./systems/PickSystem";
import ShadowMapSystem from "./systems/ShadowMapSystem";
import TransformSystem from "./systems/TransformSystem";
import PostProcessingSystem from "./systems/PostProcessingSystem";
import GridComponent from "./components/GridComponent";
import Entity from "./basic/Entity";

export default function useECS(renderingProps, id, cameraType, gpu) {
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [systems, dispatchSystems] = useReducer(systemReducer, [])
    const [ready, setReady] = useState(false)
    const renderer = useRef()
    let resizeObserver

    const [initialized, setInitialized] = useState(false)
    const initiateSystems = () => {

        dispatchSystems({type: SYSTEM_ACTIONS.CLEAN})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new TransformSystem()})

        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new ShadowMapSystem(gpu)})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PickSystem(gpu)})


        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new DeferredSystem(gpu)})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PostProcessingSystem(gpu)})

        if (!initialized) {

            setInitialized(true)
            const gridEntity = new Entity(undefined, 'Grid')
            dispatchEntities({type: ENTITY_ACTIONS.ADD, payload: gridEntity})
            dispatchEntities({
                type: ENTITY_ACTIONS.ADD_COMPONENT, payload: {
                    entityID: gridEntity.id,
                    data: new GridComponent(gpu)
                }
            })

            setReady(true)
        }
    }
    const resizeCallback = () => {
        if (gpu && initialized) {
            renderer.current?.stop()
            initiateSystems()
            // renderer.current?.start(entities, systems)
        }

    }
    useEffect(() => {
        if( id) {
            resizeObserver = new ResizeObserver(resizeCallback)
            resizeObserver.observe(document.getElementById(id + '-canvas'))
        }
    }, [gpu, initialized,  id])
    useEffect(() => {

        if (initialized) {
            renderer.current?.stop()
            renderer.current?.updateParams(renderingProps, entities, renderingProps.materials, renderingProps.meshes)
            renderer.current?.start(entities, systems)
        }
        return () => {
            renderer.current?.stop()
        }
    }, [renderingProps, entities, initialized])
    useEffect(() => {
        if (gpu && !initialized &&  id) {
            renderer.current = new Engine(id, cameraType, gpu)

            initiateSystems()
            renderer.current?.updateParams(renderingProps, entities, renderingProps.materials, renderingProps.meshes)
        }
    }, [renderingProps, ready, entities, systems, gpu, id])
    return {
        ready,
        entities, dispatchEntities,
        systems, dispatchSystems
    }
}