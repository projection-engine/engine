import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import {v4} from "uuid";

const identity = mat4.create()
export default class LightProbeComponent extends Component {
    probes = []

    constructor(id) {
        super(id);
    }

    addProbe(translation = [10, 10, 10]) {
        const m =  mat4.scale([], mat4.translate([], identity, translation), [.3, .3, .3])
        this.probes.push({
            id: v4().toString(),
            translation,
            transformationMatrix: m,
            transformedMatrix: m
        })

    }

    updateProbe(s, key, data) {
        const found = this.probes.find(p => p.id === s)
        if (found)
            found[key] = data
    }

    removeProbe(s) {
        this.probes = this.probes.filter(p => p.id !== s)
    }
}

