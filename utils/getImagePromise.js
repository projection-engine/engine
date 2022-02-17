export default function getImagePromise(src, type){
    return new Promise(resolve => {
        const i = new Image()
        i.src = src
        i.onload = () => {
            resolve({
                data: i,
                type})
        }
    })
}