import {useEffect, useReducer, useRef, useState} from "react";
import entityReducer, {ENTITY_ACTIONS} from "./ecs/utils/entityReducer";
import Engine from "./Engine";
import DeferredSystem from "./ecs/systems/DeferredSystem";
import PickSystem from "./ecs/systems/PickSystem";
import ShadowMapSystem from "./ecs/systems/ShadowMapSystem";
import TransformSystem from "./ecs/systems/TransformSystem";
import PostProcessingSystem from "./ecs/systems/PostProcessingSystem";
import GridComponent from "./ecs/components/GridComponent";
import Entity from "./ecs/basic/Entity";
import PhysicsSystem from "./ecs/systems/PhysicsSystem";
import parseEngineEntities from "./utils/parseEngineEntities";

export default function useECS(renderingProps, id, gpu) {
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [ready, setReady] = useState(false)

    const renderer = useRef()
    let resizeObserver

    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        if(initialized){
            renderer.current.systems = [
                new DeferredSystem(gpu, renderingProps.resolutionMultiplier),
                new PostProcessingSystem(gpu, renderingProps.resolutionMultiplier)
            ]
        }
    }, [renderingProps.resolutionMultiplier])



    const resizeCallback = () => {
        if (gpu && initialized) {
            renderer.current?.stop()
            renderer.current.camera.aspectRatio = gpu.canvas.width / gpu.canvas.height
            renderer.current?.start(entities)
        }
    }

    useEffect(() => {
        if (id) {
            resizeObserver = new ResizeObserver(resizeCallback)
            resizeObserver.observe(document.getElementById(id + '-canvas'))
        }
    }, [gpu, initialized, id, entities])

    useEffect(() => {

        if (initialized) {
            renderer.current?.stop()
            parseEngineEntities(renderingProps, entities, renderingProps.materials, renderingProps.meshes, renderer.current)
            renderer.current?.start(entities)
        }
        return () => {
            renderer.current?.stop()
        }
    }, [renderingProps, entities, initialized])
    useEffect(() => {
        if (gpu && !initialized && id) {
            const gridEntity = new Entity(undefined, 'Grid')
            renderer.current = new Engine(id, gpu)
            renderer.current.systems = [
                new PhysicsSystem(),
                new TransformSystem(),
                new ShadowMapSystem(gpu),
                new PickSystem(gpu),
                new DeferredSystem(gpu, renderingProps.resolutionMultiplier),
                new PostProcessingSystem(gpu, renderingProps.resolutionMultiplier)
            ]
            setInitialized(true)


            dispatchEntities({type: ENTITY_ACTIONS.ADD, payload: gridEntity})
            dispatchEntities({
                type: ENTITY_ACTIONS.ADD_COMPONENT, payload: {
                    entityID: gridEntity.id,
                    data: new GridComponent(gpu)
                }
            })
            setReady(true)

            parseEngineEntities(renderingProps, entities, renderingProps.materials, renderingProps.meshes, renderer.current)
        }
    }, [renderingProps, ready, entities, gpu, id])
    return {
        ready,
        entities, dispatchEntities
    }
}