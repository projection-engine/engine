import COMPONENTS from "../static/COMPONENTS";
import DirectionalLightComponent from "./components/rendering/DirectionalLightComponent";
import MeshComponent from "./components/rendering/MeshComponent";
import PointLightComponent from "./components/rendering/PointLightComponent";
import ProbeComponent from "./components/rendering/ProbeComponent";
import CameraComponent from "./components/misc/CameraComponent";
import SpriteComponent from "./components/rendering/SpriteComponent";
import PhysicsColliderComponent from "./components/physics/PhysicsColliderComponent";
import RigidBodyComponent from "./components/physics/RigidBodyComponent";
import CullingComponent from "./components/misc/CullingComponent";
import UIComponent from "./components/misc/UIComponent";
import TerrainComponent from "./components/rendering/TerrainComponent";

export default {
    [COMPONENTS.DIRECTIONAL_LIGHT]: DirectionalLightComponent,
    [COMPONENTS.MESH]: MeshComponent,
    [COMPONENTS.POINT_LIGHT]: PointLightComponent,
    [COMPONENTS.PROBE]: ProbeComponent,
    [COMPONENTS.CAMERA]: CameraComponent,
    [COMPONENTS.SPRITE]: SpriteComponent,

    [COMPONENTS.PHYSICS_COLLIDER]: PhysicsColliderComponent,
    [COMPONENTS.RIGID_BODY]: RigidBodyComponent,
    [COMPONENTS.CULLING]: CullingComponent,
    [COMPONENTS.UI]: UIComponent,

    [COMPONENTS.TERRAIN]: TerrainComponent,
}