import COMPONENTS from "../../static/COMPONENTS.js";
import Engine from "../../Engine";
import InputEventsAPI from "./utils/InputEventsAPI";
import QueryAPI from "./utils/QueryAPI";

const STYLES = {
    position: "absolute",
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "none"
}
const BODY_STYLE = `
<style>
html,
body {
    padding: 0;
    margin: 0;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
   
    color: #f0f0f0;
}
* { 
    box-sizing: border-box;
}
</style>
`
export default class UIAPI {
    static document
    static uiMountingPoint
    static #useIframe = false
    static #iframeParent

    static set useIframe(data) {
        UIAPI.#useIframe = data
    }

    static deleteUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        if (!UI || !UI.__element)
            return
        const children = UI.__element.querySelectorAll("[data-enginewrapper='-']")
        children.forEach(c => {
            UI.__element.removeChild(c)
            UIAPI.uiMountingPoint.appendChild(c)
            UI.anchorElement = undefined
        })
        const p = UI.__element.parentElement
        if (p)
            p.removeChild(UI.__element)
    }

    static createUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        if (!entity.active || !UI || QueryAPI.getEntityByQueryID(entity.queryKey) !== entity)
            return

        const el = UIAPI.document.createElement("div")
        const obj = {}
        UI.wrapperStyles.forEach(([k, v]) => {
            obj[k] = v
        })
        Object.assign(el.style, obj)
        el.id = entity.queryKey
        const html = Engine.UILayouts.get(UI.uiLayoutID)
        el.innerHTML = html ? html : ""

        el.setAttribute("data-enginewrapper", "-")
        el.setAttribute("data-engineentityid", entity.id)

        UIAPI.uiMountingPoint.appendChild(el)
        UI.__element = el

        return {parent: UI.anchorElement, element: el}
    }

    static buildUI(t) {
        const target = t || InputEventsAPI.targetElement
        UIAPI.destroyUI()
        UIAPI.#iframeParent = target
        if (UIAPI.#useIframe) {
            const iframe = document.createElement("iframe")
            Object.assign(iframe.style, STYLES)
            target.appendChild(iframe)
            UIAPI.document = iframe.contentWindow.document
            UIAPI.document.body.innerHTML = BODY_STYLE
        } else
            UIAPI.document = window.document

        UIAPI.uiMountingPoint = UIAPI.document.body

        const elementsToBind = []
        const entities = Engine.entities
        for (let i = 0; i < entities.length; i++)
            elementsToBind.push(UIAPI.createUIEntity(entities[i]))
        for (let i = 0; i < elementsToBind.length; i++) {
            if (!elementsToBind[i])
                continue
            const {parent, element} = elementsToBind[i]
            const parentElement = UIAPI.document.getElementById(parent)
            if (!parentElement)
                continue
            UIAPI.uiMountingPoint.removeChild(element)
            parentElement.appendChild(element)
        }
    }

    static updateUIEntity(entity) {
        const UI = entity.components.get(COMPONENTS.UI)
        if (!entity.active || !UI || QueryAPI.getEntityByQueryID(entity.queryKey) !== entity || !UI.__element)
            return

        const el = UI.__element
        el.removeAttribute("style")
        const obj = {}
        UI.wrapperStyles.forEach(([k, v]) => obj[k] = v)
        Object.assign(el.style, obj)
        el.id = entity.queryKey
        const html = Engine.UILayouts.get(UI.uiLayoutID)
        el.innerHTML = html ? html : ""
    }

    static destroyUI() {
        if (!UIAPI.uiMountingPoint)
            return

        UIAPI.uiMountingPoint.innerHTML = ""
        const entities = Engine.entities
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]
            const UI = entity.components.get(COMPONENTS.UI)
            if (!entity.active || !UI || QueryAPI.getEntityByQueryID(entity.queryKey) !== entity)
                continue
            UI.__element = undefined
        }


        if (UIAPI.#iframeParent) {
            UIAPI.#iframeParent.removeChild(UIAPI.#iframeParent.querySelector("iframe"))
            UIAPI.#iframeParent = undefined
        }

    }
}