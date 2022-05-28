export default function toObject(classes){
    const keys = classes.filter(c => c !== undefined).map((m, i) => {
        return {id: m.id, index: i}
    })
    let res = {}

    keys.forEach(k => {
        res[k.id] = classes[k.index]
    })

    return res
}