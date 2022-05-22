export default class Conversion {
    static toQuadCoord(coords, quadSize, canvas) {
        const target = canvas.getBoundingClientRect()
        const {x, y} = coords
        const {w, h} = quadSize

        const multiplierX = w / target.width
        const multiplierY = h / target.height

        return {
            x: x * multiplierX,
            y: h - y * multiplierY + target.top * multiplierY - 1
        }
    }
}