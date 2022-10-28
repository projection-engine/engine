export default function serializeStructure(obj) {
    const visited = new WeakSet();
    return JSON.stringify(
        obj,
        (key, value) => {
            if (key.startsWith("#") || key.startsWith("__"))
                return undefined
            if (typeof value === "object" && value !== null) {
                if (visited.has(value))
                    return
                visited.add(value);
            }
            if (value instanceof Int8Array ||
                value instanceof Uint8Array ||
                value instanceof Uint8ClampedArray ||
                value instanceof Int16Array ||
                value instanceof Uint16Array ||
                value instanceof Int32Array ||
                value instanceof Uint32Array ||
                value instanceof Float32Array ||
                value instanceof Float64Array)
                return Array.from(value)
            return value
        },
        4)
}