export default function copyWithOffset(target, m, offset) {
    const len = m.length
    for (let i = 0; i < len; i++)
        target[i + offset] = m[i]
}