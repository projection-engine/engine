export function colorToImage(color) {
    let c = document.createElement("canvas");
    c.width=1024
    c.height=1024
    let ctx = c.getContext("2d");
    ctx.fillStyle = color
    ctx.fillRect(0,0,1024,1024)
    return c.toDataURL()
}


export function toDataURL(src, callback) {

    let img = new Image();
    img.onload = function () {

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let dataURL;
        canvas.height = this.height;
        canvas.width =  this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL();

        callback(dataURL);
    };
    img.src = src;

    if (img.complete || img.complete === undefined) {
        img.src = "data:image_preview/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = src;
    }
}