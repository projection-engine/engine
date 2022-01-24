export default function generateGrid(div, size = 1) {

    let vertices = [],
        step = size / div,
        half = size / 2;

    let p;
    for (let i = 0; i <= div; i++) {
        p = -half + (i * step);
        vertices.push(p);
        vertices.push(0);
        vertices.push(half);

        vertices.push(p);
        vertices.push(0);
        vertices.push(-half);

        p = half - (i * step);
        vertices.push(-half);
        vertices.push(0);
        vertices.push(p);


        vertices.push(half);
        vertices.push(0);
        vertices.push(p);

    }
    return vertices
}