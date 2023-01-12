import Component from "./Component"

export default class UIComponent extends Component {
    __element?: HTMLElement
    uiLayoutID?: string
    wrapperStyles: [string, string][] = []
    anchorElement?: string = ""
}

