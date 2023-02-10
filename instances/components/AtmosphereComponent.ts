import Component from "./Component"
import ATMOSPHERE_PROPS from "../../static/component-props/ATMOSPHERE_PROPS";
import ATMOSPHERE_TYPES from "../../static/ATMOSPHERE_TYPES";
import {mat4, vec3} from "gl-matrix";
import LightsAPI from "../../lib/utils/LightsAPI";


export default class AtmosphereComponent extends Component {
    _props = ATMOSPHERE_PROPS

    constructor() {
        super();
        this.elapsedTime = 0
    }
    _elapsedTime = 0
    #sunDirection = <vec3>[0, 1, 1]
    maxSamples = 10
    mieHeight = 1000
    rayleighHeight = 8000
    atmosphereRadius = 1
    planetRadius = 1
    intensity = 20
    renderingType = ATMOSPHERE_TYPES.COMBINED
    betaRayleigh = [1.,1,1]
    betaMie = [1,1,1]
    threshold = 0

    get sunDirection() {
        return this.#sunDirection
    }

    set elapsedTime(data) {
        this._elapsedTime = data
        vec3.normalize(this.#sunDirection, [Math.sin(this._elapsedTime), Math.cos(this._elapsedTime), 1.0])
        if(this.entity?.active){
            this.entity.needsLightUpdate = true
            LightsAPI.packageLights(true, true)
        }
    }

    get elapsedTime() {
        return this._elapsedTime
    }


    // 0  [0][0]  1  [0][1] 2  [0][2] 3  [0][3]
    // 4  [1][0]  5  [1][1] 6  [1][2] 7  [1][3]
    // 8  [2][0]  9  [2][1] 10 [2][2] 11 [2][3]
    // 12 [3][0]  13 [3][1] 14 [3][2] 15 [3][3]

    static bindResources(matrix: mat4, component:AtmosphereComponent){
        matrix[0] = component.#sunDirection[0]
        matrix[1]=  component.#sunDirection[1]
        matrix[2]= component.#sunDirection[2]
        matrix[3]= component.betaRayleigh[0] * 263157
        matrix[4]= component.betaRayleigh[1] * 74074
        matrix[5]= component.betaRayleigh[2] * 30211
        matrix[6]= component.betaMie[0] * 476
        matrix[7]= component.betaMie[1]* 476
        matrix[8]= component.betaMie[2]* 476
        matrix[9]= component.intensity
        matrix[10]= component.atmosphereRadius
        matrix[11]= component.planetRadius
        matrix[12]= component.rayleighHeight
        matrix[13]= component.mieHeight
        matrix[14]= component.maxSamples
        matrix[15]= component.threshold
    }
}