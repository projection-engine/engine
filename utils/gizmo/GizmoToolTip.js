import COMPONENTS from "../../templates/COMPONENTS";

export default class GizmoToolTip {
    constructor(element) {
        this.renderTarget = element
    }

    start(label) {
        Object.assign(this.renderTarget.style, {
            display: 'flex',
            justifyContent: 'space-evenly',

            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '4px',
            top: 'unset',
            width: '300px',
            overflow: 'hidden'
        });
    }
    stop(){
        Object.assign(this.renderTarget.style, {
            display: 'none',
            justifyContent: 'unset',
            left: 'unset',
            transform: 'unset',
            bottom: 'unset',
            top: 'unset',
            width: 'fit-content'
        });

        this.renderTarget.innerHTML = ''
    }

    render([x, y, z]) {
        this.renderTarget.innerHTML = ` 
        <div style="display: flex;align-items: center;justify-content: center; width: 100%;gap: 4px">
            <label style="color: red;font-weight: bolder; font-size: .9rem"">X:</label> ${x.toFixed(2)}
        </div>
        <div style="display: flex;align-items: center;justify-content: center; width: 100%;gap: 4px ">
            <label style="color: darkgreen; font-weight: bolder; font-size: .9rem">Y:</label> ${y.toFixed(2)}
        </div>
        <div style="display: flex;align-items: center;justify-content: center; width: 100%;gap: 4px ">
            <label style="color: blue;font-weight: bolder; font-size: .9rem"">Z:</label> ${z.toFixed(2)}
        </div>
    `
    }

}
