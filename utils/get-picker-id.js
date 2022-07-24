export default function getPickerId(i) {
    return [
        ((i >>  0) & 0xFF) / 0xFF,
        ((i >>  8) & 0xFF) / 0xFF,
        ((i >> 16) & 0xFF) / 0xFF
    ]
}