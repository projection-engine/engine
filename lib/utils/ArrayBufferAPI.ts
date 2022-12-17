export default class ArrayBufferAPI {
    static allocateVector(size:number, defaultValue = 0, asQuaternion:boolean, shared=true, integer:boolean):Uint8Array|Float32Array {
        const arrayBuffer = shared ? new SharedArrayBuffer(size  * 4) : new ArrayBuffer( size * 4)
        const b:Uint8Array|Float32Array =  integer ? new Uint8Array(arrayBuffer) : new Float32Array(arrayBuffer)
        for (let i = 0; i < size; i++)
            b[i] = defaultValue

        if (asQuaternion)
            b[3] = 1
        return b
    }

    static allocateMatrix(size:number, identity:boolean, shared=true):Float32Array {
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