import System from "../basic/System";

export const SYSTEM_ACTIONS = {
    ADD: '0-A',
    REMOVE: '0-B',
    MOVE: '0-C',
    CLEAN: 4
}

export default function systemReducer(state, action) {
    let stateClone = [...state]
    switch (action.type) {
        case SYSTEM_ACTIONS.ADD: {
            if (action.payload instanceof System)
                stateClone.push(action.payload)
            return stateClone
        }
        case SYSTEM_ACTIONS.REMOVE: {
            const index = state.indexOf(action.payload)
            if (index > -1)
                stateClone.splice(index, 1)
            return stateClone
        }
        case SYSTEM_ACTIONS.MOVE: {
            const oldIndex = state.indexOf(action.payload.instance)
            if (oldIndex > -1) {
                delete stateClone[action.payload.constructor.name]

                if (action.payload.newIndex >= stateClone.length) {
                    let k = action.payload.newIndex - stateClone.length + 1;
                    while (k--) {
                        stateClone.push(undefined);
                    }
                }
                stateClone.splice(action.payload.newIndex, 0, stateClone.splice(oldIndex, 1)[0]);
                return stateClone
            }

            return stateClone
        }
        case SYSTEM_ACTIONS.CLEAN:
            return []
        default:
            return state
    }
}