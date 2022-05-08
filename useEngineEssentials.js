import {useReducer, useState} from "react";
import PickComponent from "./components/PickComponent";
import COMPONENTS from "./templates/COMPONENTS";
import ScriptComponent from "./components/ScriptComponent";

export default function useEngineEssentials() {
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


export const ENTITY_ACTIONS = {
    ADD: 0,

    UPDATE: 2,
    UPDATE_COMPONENT: 3,

    REMOVE: 4,
    DISPATCH_BLOCK: 6,
    PUSH_BLOCK: 7,
    REMOVE_BLOCK: 8,
    CLEAR: 9,
    LINK_MULTIPLE: 10
}

function deleteEntity(entity, entities) {
    let copy = [...entities].filter(e => e.id !== entity.id)
    for (let i = 0; i < copy.length; i++) {
        if (copy[i].linkedTo === entity.id)
            copy = deleteEntity(copy[i], copy)
    }
    return copy
}

function entityReducer(state, {type, payload}) {
    let stateCopy = [...state]
    const entityIndex = state.findIndex(e => e.id === payload?.entityID)

    if (entityIndex > -1) {
        const entity = stateCopy[entityIndex]
        switch (type) {
            // ENTITY
            case ENTITY_ACTIONS.UPDATE: {
                const {
                    key,
                    data,
                } = payload
                if (key === 'name')
                    entity.name = data
                else if (key === 'active')
                    entity.active = data
                else if (key === 'linkedTo')
                    entity.linkedTo = data

                stateCopy[entityIndex] = entity
                return stateCopy
            }
            case ENTITY_ACTIONS.REMOVE: {

                return deleteEntity(stateCopy[entityIndex], stateCopy)
            }

            case ENTITY_ACTIONS.UPDATE_COMPONENT: {
                const {
                    key,
                    data,
                } = payload
                entity.components[key] = data

                stateCopy[entityIndex] = entity
                return stateCopy
            }
            default:
                return stateCopy
        }
    } else
        switch (type) {
            case ENTITY_ACTIONS.LINK_MULTIPLE:
                return state.map(s => {
                    if (payload.indexOf(s.id) > 0) {
                        s.linkedTo = payload[0]
                    }
                    return s
                })
            case ENTITY_ACTIONS.CLEAR:
                return []
            case ENTITY_ACTIONS.ADD: {
                const entity = payload
                entity.components[COMPONENTS.PICK] = new PickComponent(undefined, state.length + 2)
                entity.components[COMPONENTS.SCRIPT] = new ScriptComponent()
                return [...state, entity]
            }
            case ENTITY_ACTIONS.DISPATCH_BLOCK: {
                const block = payload
                if (Array.isArray(block))
                    return block.map((entity, i) => {
                        entity.components[COMPONENTS.PICK] = new PickComponent(undefined, state.length + i + 1)
                        if (!entity.components[COMPONENTS.SCRIPT])
                            entity.components[COMPONENTS.SCRIPT] = new ScriptComponent()
                        return entity
                    })
                else
                    return stateCopy
            }
            case ENTITY_ACTIONS.REMOVE_BLOCK: {
                const block = payload
                if (Array.isArray(block)) {
                    return stateCopy.filter(e => !block.includes(e.id) && !block.includes(e.linkedTo))
                } else
                    return stateCopy
            }
            case ENTITY_ACTIONS.PUSH_BLOCK: {
                const block = payload

                if (Array.isArray(block))
                    return [...stateCopy, ...block.map((e, i) => {
                        const entity = e
                        entity.components[COMPONENTS.PICK] = new PickComponent(undefined, i + state.length + 2)
                        if (!entity.components[COMPONENTS.SCRIPT])
                            entity.components[COMPONENTS.SCRIPT] = new ScriptComponent()
                        return entity
                    })]
                else
                    return stateCopy
            }
            default:
                return stateCopy
        }

}
