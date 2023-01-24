import Texture from "../instances/Texture";

interface TextureMeta{
    key: string
    texture: Texture
}
interface TextureInUse {
    [key:string]: TextureMeta
}
export default TextureInUse