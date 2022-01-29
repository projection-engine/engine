import {useEffect, useMemo, useReducer, useRef, useState} from "react";
import entityReducer, {ENTITY_ACTIONS} from "./ecs/utils/entityReducer";
import systemReducer, {SYSTEM_ACTIONS} from "./ecs/utils/systemReducer";
import Engine from "./Engine";
import DeferredSystem from "./ecs/systems/DeferredSystem";
import PickSystem from "./ecs/systems/PickSystem";
import ShadowMapSystem from "./ecs/systems/ShadowMapSystem";
import TransformSystem from "./ecs/systems/TransformSystem";
import PostProcessingSystem from "./ecs/systems/PostProcessingSystem";
import GridComponent from "./ecs/components/GridComponent";
import Entity from "./ecs/basic/Entity";
import PhysicsSystem from "./ecs/systems/PhysicsSystem";

export default function useECS(renderingProps, id, gpu) {
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [systems, dispatchSystems] = useReducer(systemReducer, [])
    const [ready, setReady] = useState(false)

    const renderer = useRef()
    let resizeObserver

    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if(initialized){
            dispatchSystems({type: SYSTEM_ACTIONS.REMOVE, payload: DeferredSystem})
            dispatchSystems({type: SYSTEM_ACTIONS.REMOVE, payload: PostProcessingSystem})

            dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new DeferredSystem(gpu, renderingProps.resolutionMultiplier)})
            dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PostProcessingSystem(gpu, renderingProps.resolutionMultiplier)})
        }
    }, [renderingProps.resolutionMultiplier])

    const initiateSystems = () => {
        dispatchSystems({type: SYSTEM_ACTIONS.CLEAN})

        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PhysicsSystem()})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new TransformSystem()})

        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new ShadowMapSystem(gpu)})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PickSystem(gpu)})

        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new DeferredSystem(gpu, renderingProps.resolutionMultiplier)})
        dispatchSystems({type: SYSTEM_ACTIONS.ADD, payload: new PostProcessingSystem(gpu, renderingProps.resolutionMultiplier)})

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
            renderer.current.camera.aspectRatio = gpu.canvas.width / gpu.canvas.height
            renderer.current?.start(entities, systems)

        }

    }
    useEffect(() => {

        if (id) {
            resizeObserver = new ResizeObserver(resizeCallback)
            resizeObserver.observe(document.getElementById(id + '-canvas'))
        }
    }, [gpu, initialized, id, entities, systems])
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
        if (gpu && !initialized && id) {
            renderer.current = new Engine(id, gpu)

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