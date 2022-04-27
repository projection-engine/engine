import Entity from "../shared/ecs/basic/Entity";
import Component from "../shared/ecs/basic/Component";
import PickComponent from "../shared/ecs/components/PickComponent";
import generateNextID from "./generateNextID";
import COMPONENTS from "../shared/templates/COMPONENTS";


export const ENTITY_ACTIONS = {
    ADD: 0,

    UPDATE: 2,
    UPDATE_COMPONENT: 3,

    REMOVE: 4,
    REMOVE_COMPONENT: 5,

    DISPATCH_BLOCK: 6,
    PUSH_BLOCK: 7,
    REMOVE_BLOCK: 8,
    CLEAR: 9
}

function deleteEntity(entity, entities) {
    let copy = [...entities].filter(e => e.id !== entity.id)
    for (let i = 0; i < copy.length; i++) {
        if (copy[i].linkedTo === entity.id)
            copy = deleteEntity(copy[i], copy)
    }
    return copy
}

export default function entityReducer(state, {type, payload}) {
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
            case ENTITY_ACTIONS.REMOVE_COMPONENT: {
                entity.removeComponent(payload.constructor.name)
                stateCopy[entityIndex] = entity
                return stateCopy
            }
            default:
                return stateCopy
        }
    } else
        switch (type) {
            case ENTITY_ACTIONS.CLEAR:
                return []
            case ENTITY_ACTIONS.ADD: {
                if (payload instanceof Entity) {
                    if (payload.components[COMPONENTS.PICK] instanceof PickComponent)
                        payload.components[COMPONENTS.PICK].__pickID = generateNextID(state.length + 2)

                    stateCopy.push(payload)
                }

                return stateCopy
            }
            case ENTITY_ACTIONS.DISPATCH_BLOCK: {
                const block = payload
                if (Array.isArray(block))
                    return block
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
                        if (e.components[COMPONENTS.PICK]) {
                            delete e.components[COMPONENTS.PICK]
                            e.components[COMPONENTS.PICK] = new PickComponent(undefined, i + stateCopy.length + 1)
                        }

                        return e
                    })]
                else
                    return stateCopy
            }
            default:
                return stateCopy
        }

}
