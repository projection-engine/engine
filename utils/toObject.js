export default function toObject(classes, onlyID){
    const res = {}, s = classes.length
    for(let i = 0; i < s; i++) {
        if (onlyID)
            res[classes[i].id] = classes[i].id
        else
            res[classes[i].id] = classes[i]
    }
    
    return res
}