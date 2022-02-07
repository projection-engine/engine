

export default function groupInto(size, mainArray) {
    let arrayOfArrays = [];
    for (let i = 0; i < mainArray.length; i += size) {
        arrayOfArrays.push(mainArray.slice(i, i + size));
    }

    return arrayOfArrays
}