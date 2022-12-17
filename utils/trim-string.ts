export default function trimString(str) {
    return str.replaceAll(/^(\s*)/gm, "").replaceAll(/^\s*\n/gm, "")
}