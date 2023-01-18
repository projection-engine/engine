import Component from "./Component";
import DECAL_PROPS from "../../static/component-props/DECAL_PROPS";
import Texture from "../Texture";
import GPU from "../../GPU";
import FileSystemAPI from "../../lib/utils/FileSystemAPI";
import TextureParams from "../../templates/TextureParams";
import GPUAPI from "../../lib/rendering/GPUAPI";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";

export default class DecalComponent extends Component {
    _albedoID?: string
    _roughnessID?: string
    _metallicID?: string
    _normalID?: string
    _occlusionID?: string

    #albedo?: Texture
    #roughness?: Texture
    #metallic?: Texture
    #normal?: Texture
    #occlusion?: Texture
    useSSR = false
    renderingMode = MATERIAL_RENDERING_TYPES.ISOTROPIC

    anisotropicRotation = 0
    anisotropy = 0
    clearCoat = 0
    sheen = 0
    sheenTint = 0

    get albedo(): Texture {
        return this.#albedo;
    }

    get roughness(): Texture {
        return this.#roughness;
    }

    get metallic(): Texture {
        return this.#metallic;
    }

    get normal(): Texture {
        return this.#normal;
    }

    get occlusion(): Texture {
        return this.#occlusion;
    }


    static async #fetchIfNotFound(id: string): Promise<Texture | undefined> {
        try {
            const asset = await FileSystemAPI.readAsset(id)
            if (!asset)
                return
            const textureData = <TextureParams>(typeof asset === "string" ? JSON.parse(asset) : asset)
            return await GPUAPI.allocateTexture({
                ...textureData,
                img: textureData.base64
            }, id)
        } catch (err) {
            console.error(err)
        }
    }

    set albedoID(value: string) {
        this.#albedo = GPU.textures.get(value)
        if (value && !this.albedo)
            DecalComponent.#fetchIfNotFound(value).then(res => this.#albedo = res)
        this._albedoID = value;
    }

    set roughnessID(value: string) {
        this.#roughness = GPU.textures.get(value)
        if (value && !this.roughness)
            DecalComponent.#fetchIfNotFound(value).then(res => this.#roughness = res)
        this._roughnessID = value;
    }

    set metallicID(value: string) {
        this.#metallic = GPU.textures.get(value)
        if (value && !this.metallic)
            DecalComponent.#fetchIfNotFound(value).then(res => this.#metallic = res)
        this._metallicID = value;
    }

    set normalID(value: string) {
        this.#normal = GPU.textures.get(value)
        if (value && !this.normal)
            DecalComponent.#fetchIfNotFound(value).then(res => this.#normal = res)
        this._normalID = value;
    }

    set occlusionID(value: string) {
        this.#occlusion = GPU.textures.get(value)
        if (value && !this.occlusion)
            DecalComponent.#fetchIfNotFound(value).then(res => this.#occlusion = res)
        this._occlusionID = value;
    }

    get albedoID(): string {
        return this._albedoID;
    }

    get roughnessID(): string {
        return this._roughnessID;
    }

    get metallicID(): string {
        return this._metallicID;
    }

    get normalID(): string {
        return this._normalID;
    }

    get occlusionID(): string {
        return this._occlusionID;
    }

    _props = DECAL_PROPS
}