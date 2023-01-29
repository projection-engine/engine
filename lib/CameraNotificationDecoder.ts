import ArrayBufferAPI from "./utils/ArrayBufferAPI";

export default class CameraNotificationDecoder {
    static #buffer:Float32Array
    static #initialized =false
    static get ORTHOGRAPHIC(){
        return 1
    }
    static get PERSPECTIVE(){
        return 0
    }
    static generateBuffer(){
        const b = <Float32Array>ArrayBufferAPI.allocateVector(7, 0)
        b[0] = 1
        b[1] = 1
        b[2] = 0

        b[3] = 0
        b[4] = 0

        b[5] = .001
        b[6] = 0
        return b
    }
    static initialize(buffer:Float32Array){
        if(CameraNotificationDecoder.#initialized)
            return
        CameraNotificationDecoder.#initialized = true
        CameraNotificationDecoder.#buffer = buffer
    }

    static get viewNeedsUpdate(){
        return CameraNotificationDecoder.#buffer[0]
    }
    static get projectionNeedsUpdate(){
        return CameraNotificationDecoder.#buffer[1]
    }
    static get projectionType(){
        return CameraNotificationDecoder.#buffer[2]
    }
    static get hasChangedView(){
        return CameraNotificationDecoder.#buffer[3]
    }
    static get hasChangedProjection(){
        return CameraNotificationDecoder.#buffer[4]
    }
    static get translationSmoothing(){
        return CameraNotificationDecoder.#buffer[5]
    }
    static get elapsed(){
        return CameraNotificationDecoder.#buffer[6]
    }

    static set viewNeedsUpdate(data){
        CameraNotificationDecoder.#buffer[0] = data
    }
    static set projectionNeedsUpdate(data){
        CameraNotificationDecoder.#buffer[1] = data
    }
    static set projectionType(data){
        CameraNotificationDecoder.#buffer[2] = data
    }
    static set hasChangedView(data){
        CameraNotificationDecoder.#buffer[3] = data
    }
    static set hasChangedProjection(data){
        CameraNotificationDecoder.#buffer[4] = data
    }
    static set translationSmoothing(data){
        CameraNotificationDecoder.#buffer[5] = data
    }
    static set elapsed(data){
        CameraNotificationDecoder.#buffer[6] = data
    }
}