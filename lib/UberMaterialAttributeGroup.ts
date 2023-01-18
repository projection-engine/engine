const data = new Float32Array(16)

// 0  [0][0]  1  [0][1] 2  [0][2] 3  [0][3]
// 4  [1][0]  5  [1][1] 6  [1][2] 7  [1][3]
// 8  [2][0]  9  [2][1] 10 [2][2] 11 [2][3]
// 12 [3][0]  13 [3][1] 14 [3][2] 15 [3][3]

export default class UberMaterialAttributeGroup {
    static data = data

    static clear() {
        data[0] = data[10] = data[1] = data[11] = data[2] = data[12] = data[3] = data[13] = data[4] = data[14] = data[5] = data[15] = data[6] = data[16] = data[7] = data[8] = 0
    }

    static set entityID(value: number[]) {
        data[0] = value[0]
        data[1] = value[1]
        data[2] = value[2]
    }

    static set renderingMode(value) {
        data[3] = value
    }

    static set screenDoorEffect(value) {
        data[4] = value
    }

    static set ssrEnabled(value) {
        data[5] = value
    }


    static set materialID(value) {
        data[6] = value
    }

    static set useOcclusionDecal(value) {
        data[6] = value
    }



    static set anisotropicRotation(value) {
        data[7] = value
    }

    static set anisotropy(value) {
        data[8] = value
    }

    static set clearCoat(value) {
        data[9] = value
    }

    static set sheen(value) {
        data[10] = value
    }

    static set sheenTint(value) {
        data[11] = value
    }



    static set useAlbedoDecal(value) {
        data[12] = value
    }

    static set useMetallicDecal(value) {
        data[13] = value
    }

    static set useRoughnessDecal(value) {
        data[14] = value
    }

    static set useNormalDecal(value) {
        data[15] = value
    }
}