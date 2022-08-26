function getTypedArray(someTypedArray) {
    const typedArrayTypes = [
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
        BigInt64Array,
        BigUint64Array
    ];
    return typedArrayTypes.find(ta => someTypedArray.constructor === ta)
}
function isTypedArray( arr ) {
    return ArrayBuffer.isView( arr ) && !(arr instanceof DataView);
}
export default function cloneClass(orig) {
    const newInstance = Object.create(Object.getPrototypeOf(orig))
    const entries = Object.entries(orig)


    const getValueCloned = (v) => {
        if (typeof v === "object") {
            if(Array.isArray(v)){
                if(isTypedArray(v))
                    return v.constructor(...v)
                return [...v]
            }
            return Object.assign({}, v)
        }
        return v
    }
    for (let i = 0; i < entries.length; i++) {
        const current = entries[i]
        if (typeof current[1] !== "function") {
            newInstance[current[0]] = getValueCloned(current[1])
        }
    }
    return newInstance
}