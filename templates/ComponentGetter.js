import COMPONENTS from "../static/COMPONENTS";
import DirectionalLightComponent from "./components/DirectionalLightComponent";
import MeshComponent from "./components/MeshComponent";
import PointLightComponent from "./components/PointLightComponent";
import SkyLightComponent from "./components/SkyLightComponent";
import CameraComponent from "./components/CameraComponent";
import SpriteComponent from "./components/SpriteComponent";
import PhysicsColliderComponent from "./components/PhysicsColliderComponent";
import RigidBodyComponent from "./components/RigidBodyComponent";
import CullingComponent from "./components/CullingComponent";
import UIComponent from "./components/UIComponent";
import TerrainComponent from "./components/TerrainComponent";

export default {
    [COMPONENTS.DIRECTIONAL_LIGHT]: DirectionalLightComponent,
    [COMPONENTS.MESH]: MeshComponent,
    [COMPONENTS.POINT_LIGHT]: PointLightComponent,
    [COMPONENTS.SKYLIGHT]: SkyLightComponent,
    [COMPONENTS.CAMERA]: CameraComponent,
    [COMPONENTS.SPRITE]: SpriteComponent,

    [COMPONENTS.PHYSICS_COLLIDER]: PhysicsColliderComponent,
    [COMPONENTS.RIGID_BODY]: RigidBodyComponent,
    [COMPONENTS.CULLING]: CullingComponent,
    [COMPONENTS.UI]: UIComponent,

    [COMPONENTS.TERRAIN]: TerrainComponent,
}