import Component from "../basic/Component";

export default class MaterialComponent extends Component {
    materialID
    constructor(
        id,
        name='Empty material',
        active,
        materialID
    ) {
        super(id, name, active);
        this.materialID = materialID
    }
}