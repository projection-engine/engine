export default function resolveRelationship(currentNode, outputs, links, nodes, body, isVertex) {
    const inputs = {}
    const linksToResolve = links.filter(l => l.target.id === currentNode.id)
    linksToResolve.forEach(link => {
        const source = nodes.find(n => n.id === link.source.id)

        if (!source.ready)
            resolveRelationship(source, links.filter(l => l.source.id === source.id).map(l => l.source.attribute.key), links, nodes, body)

        inputs[link.target.attribute.key] = {
            name: source[link.source.attribute.key],
            type: link.source.attribute.type
        }
    })
    body.push(currentNode.getFunctionCall(inputs, nodes.findIndex(n => n.id === currentNode.id), outputs, body, isVertex))
    currentNode.ready = true
}