import Component from "./Component"
import LIGHT_PROPS from "../../static/component-props/LIGHT_PROPS";
import LIGHT_TYPES from "../../static/LIGHT_TYPES";
import {mat4, vec3} from "gl-matrix";
import DirectionalShadows from "../../runtime/rendering/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/rendering/OmnidirectionalShadows";

const toRad = Math.PI/180
const lightView = mat4.create(), lightProjection = mat4.create(), lightViewProjection = mat4.create()

export default class LightComponent extends Component {

    name = "LIGHT"
    _props = LIGHT_PROPS

    // -------------- GLOBAL --------------
    type = LIGHT_TYPES.DIRECTIONAL
    hasSSS = false
    shadowBias = .0001
    shadowSamples = 3
    zNear = 1
    zFar = 10000
    cutoff = 100
    shadowAttenuationMinDistance = 50

    // -------------- POINT AND SPOT --------------
    attenuation = [0, 0]
    smoothing = .5

    // -------------- SPOTLIGHT --------------
    radius = 90

    // -------------- DIRECTIONAL --------------
    size = 35
    atlasFace = [0, 0]
    _center = [0, 0, 0]

    get center(){
        return this._center
    }
    set center(data){
        this._center = data
        this.__entity.needsLightUpdate = true
    }

    // -------------- GLOBAL --------------
    _intensity = 1
    get intensity() {
        return this._intensity
    }
    set intensity(data) {
        this._intensity = data
        this.fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }

    _color = [255, 255, 255]
    fixedColor = [1, 1, 1]
    get color() {
        return this._color
    }
    set color(data) {
        this._color = data
        this.fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }

    _shadowMap = true
    get shadowMap() {
        return this._shadowMap
    }
    set shadowMap(data) {
        if (this._shadowMap !== data)
            this.__entity.needsLightUpdate = true
        this._shadowMap = data
    }

    static updateBuffer(entity, primaryBuffer, secondaryBuffer, typeBuffer, offset){
        const component = entity.__lightComp
        const color = component.fixedColor
        const position = entity.absoluteTranslation
        const attenuation = component.attenuation

        switch (component.type){
            case LIGHT_TYPES.DIRECTIONAL:{
                const direction = vec3.add([], entity.absoluteTranslation, component._center)
                const color = component.fixedColor

                primaryBuffer[offset] = direction[0]
                primaryBuffer[offset + 1] = direction[1]
                primaryBuffer[offset + 2] = direction[2]

                primaryBuffer[offset + 4] = color[0]
                primaryBuffer[offset + 5] = color[1]
                primaryBuffer[offset + 6] = color[2]

                primaryBuffer[offset + 8] = component.atlasFace[0]
                primaryBuffer[offset + 9] = component.atlasFace[1]
                primaryBuffer[offset + 10] = (component.shadowMap ? 1 : -1) * component.shadowSamples
                primaryBuffer[offset + 12] = component.shadowBias
                primaryBuffer[offset + 13] = component.shadowAttenuationMinDistance
                primaryBuffer[offset + 14] = component.hasSSS ? 1 : 0

                if (component.shadowMap) {
                    mat4.lookAt(lightView, component.__entity.absoluteTranslation, component.center, [0, 1, 0])
                    mat4.ortho(lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)

                    mat4.multiply(lightViewProjection, lightProjection, lightView)
                    for (let i = 0; i < 16; i++)
                        secondaryBuffer[offset + i] = lightViewProjection[i]

                    DirectionalShadows.lightsToUpdate.push(component)
                }
                break
            }
            case LIGHT_TYPES.POINT:{
                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[3 + offset] = component.shadowBias

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[7 + offset] = component.shadowSamples

                primaryBuffer[8 + offset] = attenuation[0]
                primaryBuffer[9 + offset] = attenuation[1]

                primaryBuffer[10 + offset] = component.cutoff

                primaryBuffer[11 + offset] = component.zNear
                primaryBuffer[12 + offset] = component.zFar
                primaryBuffer[13 + offset] = (component.shadowMap ? -1 : 1) * (component.hasSSS ? 2 : 1)
                primaryBuffer[14 + offset] = component.shadowAttenuationMinDistance
                primaryBuffer[15 + offset] = component.cutoff * component.smoothing
                if (component.shadowMap)
                    OmnidirectionalShadows.lightsToUpdate.push(component)
                break
            }
            case LIGHT_TYPES.SPOT:
            {

                const rotatedDirection = vec3.transformQuat([], position, entity._rotationQuat)
                const radius = Math.cos(component.radius * toRad)

                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[8 + offset] = rotatedDirection[0]
                primaryBuffer[9 + offset] = rotatedDirection[1]
                primaryBuffer[10 + offset] = rotatedDirection[2]

                primaryBuffer[11 + offset] = component.cutoff

                primaryBuffer[12 + offset] = attenuation[0]
                primaryBuffer[13 + offset] = attenuation[1]

                primaryBuffer[14 + offset] = radius
                primaryBuffer[15 + offset] = component.hasSSS ? 1 : 0

                typeBuffer[offset] = component.type
                break
            }
        }
    }
}