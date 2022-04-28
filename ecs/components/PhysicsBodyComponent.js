import Component from "../basic/Component";

export default class PhysicsBodyComponent extends Component {
    _mass = 1
    _acceleration = [0, 0, 0]
    _velocity = [0, 0, 0]

    constructor(id) {
        super(id);
    }


    get mass() {
        return this._mass
    }

    get acceleration() {
        return this._acceleration
    }

    get velocity() {
        return this._velocity
    }


    set mass(data) {
        this._mass = data
    }

    set acceleration(data) {
        this._acceleration = data
    }

    set velocity(data) {
        this._velocity = data
    }
}