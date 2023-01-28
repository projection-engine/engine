import COMPONENTS from "../static/COMPONENTS";
import MeshComponent from "../instances/components/MeshComponent";
import AtmosphereComponent from "../instances/components/AtmosphereComponent";
import CameraComponent from "../instances/components/CameraComponent";
import SpriteComponent from "../instances/components/SpriteComponent";
import PhysicsColliderComponent from "../instances/components/PhysicsColliderComponent";
import RigidBodyComponent from "../instances/components/RigidBodyComponent";
import CullingComponent from "../instances/components/CullingComponent";
import UIComponent from "../instances/components/UIComponent";
import TerrainComponent from "../instances/components/TerrainComponent";
import LightComponent from "../instances/components/LightComponent";
import Component from "../instances/components/Component";
import DecalComponent from "../instances/components/DecalComponent";
import LightProbeComponent from "../instances/components/LightProbeComponent";


export default function getComponentInstance(key:string):Component|undefined{
    switch(key){
        case  COMPONENTS.LIGHT:
            return new LightComponent();
        case  COMPONENTS.MESH:
            return new MeshComponent();
        case  COMPONENTS.ATMOSPHERE:
            return new AtmosphereComponent();
        case  COMPONENTS.LIGHT_PROBE:
            return new LightProbeComponent();
        case  COMPONENTS.CAMERA:
            return new CameraComponent();
        case  COMPONENTS.SPRITE:
            return new SpriteComponent();
        case  COMPONENTS.DECAL:
            return new DecalComponent();
        case  COMPONENTS.PHYSICS_COLLIDER:
            return new PhysicsColliderComponent();
        case  COMPONENTS.RIGID_BODY:
            return new RigidBodyComponent();
        case  COMPONENTS.CULLING:
            return new CullingComponent();
        case  COMPONENTS.UI:
            return new UIComponent();
        case  COMPONENTS.TERRAIN:
            return new TerrainComponent();
    }
    return undefined
}
