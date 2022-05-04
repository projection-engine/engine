import Component from "../basic/Component";

export default class ColliderComponent extends Component {
    _radius = 10

    constructor(id, mesh) {
        super(id);
        let maxX = mesh.maxBoundingBox[0] - mesh.minBoundingBox[0],
            maxY = mesh.maxBoundingBox[1] - mesh.minBoundingBox[1],
            maxZ = mesh.maxBoundingBox[2] - mesh.minBoundingBox[2]

        this._radius = Math.max(maxX, maxY, maxZ)/2

        switch (true) {
            case maxX === this._radius:
                this._axis = 'x'
                break
            case maxY === this._radius:
                this._axis = 'y'
                break
            case maxZ === this._radius:
                this._axis = 'z'
                break
        }

    }

    get radius() {
        return this._radius
    }
    set radius (data){
        this._radius = data
    }
    get axis(){
        return this._axis
    }
}