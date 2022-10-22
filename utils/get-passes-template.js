import PASS_KEYS from "../static/metrics/PASS_KEYS";

export default function getPassesTemplate() {
    const obj = {}
    Object.keys(PASS_KEYS).forEach(k => {
        obj[k] = {total: 0}
    })
    return obj
}