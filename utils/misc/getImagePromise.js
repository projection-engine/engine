export default function getImagePromise(src) {
    return new Promise(resolve => {
        const i = new Image()
        i.src = src
        i.onload = () => {
            resolve(i)
        }
    })

}