export default function nodeParser(node) {
    let transform = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]
    let parsedNode =  {
        name: node.name,
        meshIndex: node.mesh,
        transformationMatrix: transform
    }


    if (node.matrix) {
        parsedNode.transformationMatrix = node.matrix
    } else {
        let translation = node.translation,
            rotation = node.rotation,
            scale = node.scale
        if (!translation)
            translation = [0, 0, 0]
        if (!scale)
            scale = [1, 1, 1]
        if (!rotation)
            rotation = [0, 0, 0, 1]

        //       <--
        // T * R * S

        // SCALE
        parsedNode.transformationMatrix[0] *= scale[0]
        parsedNode.transformationMatrix[5] *= scale[1]
        parsedNode.transformationMatrix[10] *= scale[2]

        // ROTATION
        parsedNode.transformationMatrix[0] *= 1 - 2 * (rotation[1] ** 2) - 2 * (rotation[2] ** 2) // times
        parsedNode.transformationMatrix[1] = 2 * rotation[0] * rotation[1] - 2 * rotation[3] * rotation[2] // 2xy - 2sz
        parsedNode.transformationMatrix[2] = 2 * rotation[0] * rotation[2] + 2 * rotation[3] * rotation[1] // 2xz + 2sy

        parsedNode.transformationMatrix[4] = 2 * rotation[0] * rotation[1] + 2 * rotation[3] * rotation[2] // 2xy + 2sz
        parsedNode.transformationMatrix[5] *= 1 - 2 * (rotation[0] ** 2) - 2 * (rotation[2] ** 2) // 1 - 2x^2 - 2z^2
        parsedNode.transformationMatrix[6] = 2 * rotation[1] * rotation[2] - 2 * rotation[3] * rotation[0] // 2yz - 2sx

        parsedNode.transformationMatrix[8] = 2 * rotation[0] * rotation[2] - 2 * rotation[3] * rotation[1] // 2xz - 2sy
        parsedNode.transformationMatrix[9] = 2 * rotation[1] * rotation[2] + 2 * rotation[3] * rotation[0] // 2yz + 2sx
        parsedNode.transformationMatrix[10] *= 1 - 2 * (rotation[0] ** 2) - 2 * (rotation[1] ** 2) // 1 - 2x^2 - 2y^2


        // TRANSLATION
        parsedNode.transformationMatrix[12] = translation[0]
        parsedNode.transformationMatrix[13] = translation[1]
        parsedNode.transformationMatrix[14] = translation[2]
    }


    return parsedNode
}
