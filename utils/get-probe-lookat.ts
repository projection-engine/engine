import {vec3} from "gl-matrix";

export default function getProbeLookat(yaw, pitch, position) {
    const cosPitch = Math.cos(pitch)
    const sinPitch = Math.sin(pitch)
    const cosYaw = Math.cos(yaw)
    const sinYaw = Math.sin(yaw)

    let xAxis = [cosYaw, 0, -sinYaw],
        yAxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch],
        zAxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw]
    let p1, p2, p3

    p1 = vec3.dot(position, <vec3>xAxis)
    p2 = vec3.dot(position, <vec3>yAxis)
    p3 = vec3.dot(position, <vec3>zAxis)

    return [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -p1, -p2, -p3, 1
    ]
}