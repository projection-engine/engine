export default function cloneClass(orig){
    return orig ? Object.assign(Object.create(Object.getPrototypeOf(orig)), orig) : orig
}