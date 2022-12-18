import {mat4} from "gl-matrix"
import Mesh from "./Mesh";
import getProbeRotation from "../utils/get-probe-rotation";
import CubeMapAPI from "../lib/rendering/CubeMapAPI";

const cacheMat4 = mat4.create()
export default class ShadowProbe {
    texture
    _resolution

    constructor(resolution) {
        this.resolution = resolution
    }

    set resolution(data) {
        this._resolution = data
        this.texture = CubeMapAPI.initializeTexture(true, data, false)
    }

    get resolution() {
        return this._resolution
    }

    draw(callback, zFar = 25, zNear = 1) {
        const resolution = this._resolution,
            texture = this.texture
        mat4.perspective(cacheMat4, Math.PI / 2, 1, zNear, zFar)

        Mesh.finishIfUsed()
        const rbo = CubeMapAPI.createRenderBuffer(resolution)
        gpu.viewport(0, 0, resolution, resolution)
        for (let i = 0; i < 6; i++) {
            const rotations = getProbeRotation(i)
            gpu.framebufferTexture2D(
                gpu.FRAMEBUFFER,
                gpu.DEPTH_ATTACHMENT,
                gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                texture,
                0
            )
            gpu.clear(gpu.DEPTH_BUFFER_BIT)
            callback(rotations.yaw, rotations.pitch, cacheMat4, i)
        }

        gpu.deleteRenderbuffer(rbo)
    }
}
