export default class ArrayBufferAPI {
    static allocateVector(size, defaultValue = 0, asQuaternion, shared=true) {
        const b = new Float32Array(shared ? new SharedArrayBuffer(size  * 4) : new ArrayBuffer( size * 4))
        for (let i = 0; i < size; i++)
            b[i] = defaultValue

        if (asQuaternion)
            b[3] = 1
        return b
    }

    static allocateMatrix(size, identity, shared=true) {
        const m = new Float32Array(shared ? new SharedArrayBuffer(size * size * 4) : new ArrayBuffer(size * size * 4))
        if (identity) {
            let row = 0, column = 0
            for (let i = 0; i < m.length; i++) {
                if(column === row)
                    m[i] = 1
                column++
                if(column >= size) {
                    column = 0
                    row++
                }

            }
        }
        return m
    }
}