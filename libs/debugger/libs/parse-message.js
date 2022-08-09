import Entity from "../../basic/Entity";

export default function parseMessage(messages){
    let message = ""
    for (let i = 0; i < messages.length; i++) {
        if (typeof messages[i] === "object")
            message += JSON.stringify(
                messages[i],
                (key, value) => {
                    if (messages[i] instanceof Entity && key === "children" || key === "parent")
                        return {}
                    return value
                },
                4) + " \n"
        else
            message += messages[i] + " \n"
    }
    return message
}