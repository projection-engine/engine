import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {KEYS} from "../../../../pages/project/utils/hooks/useHotKeys";


export default class KeyPress extends Node {

    constructor() {
        super(
            [
                {
                    label: 'Key',
                    key: 'key',
                    type: DATA_TYPES.OPTIONS,
                    bundled: true,
                    options: Object.keys(KEYS).map(k => {
                        return {
                            value: k,
                            label: KEYS[k],
                        }
                    })
                },
            ],
            [
                {label: 'Holding', key: 'holding', type: DATA_TYPES.EXECUTION, showTitle: true},
                {label: 'Pressed', key: 'pressed', type: DATA_TYPES.EXECUTION, showTitle: true},
                {label: 'Released', key: 'released', type: DATA_TYPES.EXECUTION, showTitle: true}
            ]);
        this.size = 1
        this.name = 'KeyPress'
    }

    get type() {
        return NODE_TYPES.START_POINT
    }

    static compile({
                       object,
                       nodeID,
                       executors,
                       keys,
                       state,
                       setState
                   }) {
        const isClicked = keys[executors[nodeID].key]

        if (isClicked && !state.wasClicked) {
            setState(true, 'wasClicked')
            return object.pressed
        } else if (isClicked && state.wasClicked)
            return object.holding
        else if (state.wasClicked) {
            setState(false, 'wasClicked')
            return object.released
        }

        return []
    }
}