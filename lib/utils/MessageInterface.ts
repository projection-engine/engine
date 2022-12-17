import {Types} from "./ConsoleAPI";

export default interface MessageInterface {
    type: Types,
    message: any,
    object?: any,
    blockID: string,
    src: string,
    notFirstOnBlock?: boolean
}