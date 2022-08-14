export default class UIComponent{
    uiEntity
    name = "New UI Component"
    constructor(uiEntity) {
        this.uiEntity = uiEntity
    }
    mount() {
        const ch = this.uiEntity.children
        for(let i =0; i < ch.length; i++)
            ch.mount()
    }

    unmount() {
        const ch = this.uiEntity.children
        for(let i =0; i < ch.length; i++)
            ch.unmount()
    }
}