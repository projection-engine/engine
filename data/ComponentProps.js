export default class ComponentProps {
    static group(label, children) {
        return {
            type: "group",
            label,
            children: Array.isArray(children) ? children : []
        }
    }

    static number(label, key, max, min, increment = .1) {
        return {label, max, min, increment, type: "number", key}
    }

    static string(label, key) {
        return {type: "string", label, key}
    }

    static options(label, key, options) {
        return {
            type: "options",
            label,
            options,
            key
        }
    }

    static color(label, key) {
        return {type: "color", label, key}
    }

    static boolean(label, key) {
        return {type: "boolean", label, key}
    }

    static image(label, key) {
        return {type: "image", label, key}
    }

    static mesh(label, key) {
        return {type: "mesh", label, key}
    }
}