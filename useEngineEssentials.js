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

const CHANGES = {
    MATERIAL: 0,
    TRANSFORMATION: 1,
    SCRIPT: 2,
    SKYBOX: 3
}

export default function useEngineEssentials(keepChangeHistory) {
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [scripts, setScripts] = useState([])
    const [changes, setChanges] = useState([])
    const [currentChange, setCurrentChange] = useState()

    const forwardChanges = () => {
        const c = currentChange + 1
        setCurrentChange(prev => prev + 1)
        if (c >= 0 && c <= 10) {
            switch (changes[c].type) {
                case ENTITY_ACTIONS.ADD_COMPONENT:

                    break
                case ENTITY_ACTIONS.ADD:

                    break
                case ENTITY_ACTIONS.DISPATCH_BLOCK:

                    break
                case ENTITY_ACTIONS.REMOVE:

                    break
                case ENTITY_ACTIONS.REMOVE_BLOCK:

                    break
                case ENTITY_ACTIONS.UPDATE_COMPONENT:
                    dispatchEntities({
                        type: ENTITY_ACTIONS.UPDATE_COMPONENT, payload: {
                            key: changes[c].componentKey,
                            data: changes[c].previous,
                            entityID: changes[c].entityID

                        }
                    })
                    break
                default:
                    break
            }
        }
    }
    const returnChanges = () => {
        const c = currentChange - 1
        setCurrentChange(prev => prev - 1)
        if (c >= 0) {
            switch (changes[c].type) {
                case ENTITY_ACTIONS.ADD_COMPONENT:

                    break
                case ENTITY_ACTIONS.ADD:

                    break
                case ENTITY_ACTIONS.DISPATCH_BLOCK:

                    break
                case ENTITY_ACTIONS.REMOVE:

                    break
                case ENTITY_ACTIONS.REMOVE_BLOCK:

                    break
                case ENTITY_ACTIONS.UPDATE_COMPONENT:

                    dispatchEntities({
                        type: ENTITY_ACTIONS.UPDATE_COMPONENT, payload: {
                            key: changes[c].componentKey,
                            data: changes[c].previous,
                            entityID: changes[c].entityID

                        }
                    })
                    break
                default:
                    break
            }
        }
    }
    return {
        forwardChanges,
        returnChanges,
        entities, dispatchEntities: (obj) => {
            if (keepChangeHistory) {
                let change
                switch (obj.type) {
                    case ENTITY_ACTIONS.ADD_COMPONENT:
                        change = {
                            type: obj.type,
                            componentKey: obj.payload.data.constructor.name,
                            entityID: obj.payload.entityID
                        }
                        break
                    case ENTITY_ACTIONS.ADD:
                        change = {
                            type: obj.type,
                            entityID: obj.payload.id
                        }
                        break
                    case ENTITY_ACTIONS.DISPATCH_BLOCK:
                        // change = {
                        //     type: obj.type,
                        //     entity: cloneClass(entities.find(e => e.id === obj.payload.entityID))
                        // }
                        break
                    case ENTITY_ACTIONS.REMOVE:
                        change = {
                            type: obj.type,
                            entity: cloneClass(entities.find(e => e.id === obj.payload.entityID))
                        }
                        break
                    case ENTITY_ACTIONS.REMOVE_BLOCK:
                        change = {
                            type: obj.type,
                            entities: entities.map(e => {
                                if (obj.payload.includes(e.id))
                                    return cloneClass(e)
                                else
                                    return undefined
                            }).filter(e => e)
                        }
                        break
                    case ENTITY_ACTIONS.UPDATE_COMPONENT:
                        console.log(obj)
                        change = {
                            type: obj.type,
                            componentKey: obj.payload.key,
                            entityID: obj.payload.entityID,
                            previous: cloneClass(entities.find(e => e.id === obj.payload.entityID).components[obj.payload.key])
                        }
                        break
                    default:
                        break
                }
                if (change) {
                    setCurrentChange(changes.length === 10 || change.length + 1 === 10 ? 10 : change.length + 1)
                    setChanges(prev => {
                        if (prev.length === 10)
                            prev.shift()
                        return [...prev, change]
                    })

                }
            }
            dispatchEntities(obj)
        },
        meshes, setMeshes,
        materials, setMaterials,
        scripts, setScripts
    }
}
