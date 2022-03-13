import System from "../../basic/System";
import getImagePromise from "../../../utils/misc/getImagePromise";
import pointLightIcon from "../../../../../static/icons/point_light.png";
import directionalLightIcon from "../../../../../static/icons/directional_light.png";
import spotLightIcon from "../../../../../static/icons/spot_light.png";
import cubeMapIcon from "../../../../../static/icons/cubemap.png";
import TextureInstance from "../../../instances/TextureInstance";
import BillboardsInstance from "../../../instances/BillboardsInstance";

export default class BillboardSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.billboardRenderer = new BillboardsInstance(gpu)
    }

    async initializeTextures() {

        const p = await getImagePromise(pointLightIcon),
            dir = await getImagePromise(directionalLightIcon),
            spot = await getImagePromise(spotLightIcon),
            cube = await getImagePromise(cubeMapIcon)


        this.pointLightTexture = new TextureInstance(p, false, this.gpu)
        this.directionalLightTexture = new TextureInstance(dir, false, this.gpu)

        this.spotLightTexture = new TextureInstance(spot, false, this.gpu)
        this.cubemapTexture = new TextureInstance(cube, false, this.gpu)

        this._ready = true
    }

    _map(billboards) {
        let point = [], directional = [], spot = [], cubemaps = []


        for (let i = 0; i < billboards.length; i++) {
            if (billboards[i].components.PointLightComponent)
                point.push(Array.from(billboards[i].components.PointLightComponent.transformationMatrix))
            else if (billboards[i].components.DirectionalLightComponent)
                directional.push(Array.from(billboards[i].components.DirectionalLightComponent?.transformationMatrix))
            else if (billboards[i].components.SpotLightComponent)
                spot.push(Array.from(billboards[i].components.SpotLightComponent.transformationMatrix))
            else if (billboards[i].components.CubeMapComponent)
                cubemaps.push(Array.from(billboards[i].components.CubeMapComponent.transformationMatrix))
        }

        return {
            pointLights: point,
            directionalLights: directional,
            spotLights: spot,
            cubemaps: cubemaps
        }
    }

    execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility, skylight) {
        super.execute()
        if (this._ready) {
            const billboards = [...pointLights, ...directionalLights, ...spotLights, ...cubeMaps]
            if (iconsVisibility) {
                const mapped = this._map(billboards)

                this.billboardRenderer.draw(mapped.pointLights, this.pointLightTexture.texture, camera)
                this.billboardRenderer.draw(mapped.directionalLights, this.directionalLightTexture.texture, camera)
                if(skylight)
                    this.billboardRenderer.draw([skylight.transformationMatrix], this.directionalLightTexture.texture, camera)

                this.billboardRenderer.draw(mapped.spotLights, this.spotLightTexture.texture, camera)
                this.billboardRenderer.draw(mapped.cubemaps, this.cubemapTexture.texture, camera)
            }
        }
    }

}