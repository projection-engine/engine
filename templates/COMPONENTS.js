import SkylightComponent from "../ecs/components/SkyLightComponent";
import TransformComponent from "../ecs/components/TransformComponent";
import CubeMapComponent from "../ecs/components/CubeMapComponent";
import ColliderComponent from "../ecs/components/ColliderComponent";
import DirectionalLightComponent from "../ecs/components/DirectionalLightComponent";
import PointLightComponent from "../ecs/components/PointLightComponent";
import SpotLightComponent from "../ecs/components/SpotLightComponent";
import FolderComponent from "../ecs/components/FolderComponent";
import MaterialComponent from "../ecs/components/MaterialComponent";
import MeshComponent from "../ecs/components/MeshComponent";
import PhysicsBodyComponent from "../ecs/components/PhysicsBodyComponent";
import SkyboxComponent from "../ecs/components/SkyboxComponent";
import TerrainComponent from "../ecs/components/TerrainComponent";
import ScriptComponent from "../ecs/components/ScriptComponent";
import PickComponent from "../ecs/components/PickComponent";

export default {
    TRANSFORM: TransformComponent.name,
    CUBE_MAP: CubeMapComponent.name,
    COLLIDER: ColliderComponent.name,
    DIRECTIONAL_LIGHT:DirectionalLightComponent.name,
    POINT_LIGHT: PointLightComponent.name,
    PICK: PickComponent.name,
    SPOT_LIGHT: SpotLightComponent.name,
    FOLDER: FolderComponent.name,
    MATERIAL: MaterialComponent.name,
    MESH: MeshComponent.name,
    PHYSICS: PhysicsBodyComponent.name,
    SKYBOX: SkyboxComponent.name,
    TERRAIN: TerrainComponent.name,
    SKYLIGHT: SkylightComponent.name,
    SCRIPT: ScriptComponent.name
}