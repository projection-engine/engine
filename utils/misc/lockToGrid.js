export default function lockToGrid(num, size){
    return Math.sign(num) * Math.ceil(Math.abs(num) / size) *size
}