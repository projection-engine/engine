import COMPONENTS from "../static/COMPONENTS";
import MeshComponent from "../templates/components/MeshComponent";
import SkyLightComponent from "../templates/components/SkyLightComponent";
import CameraComponent from "../templates/components/CameraComponent";
import SpriteComponent from "../templates/components/SpriteComponent";
import PhysicsColliderComponent from "../templates/components/PhysicsColliderComponent";
import RigidBodyComponent from "../templates/components/RigidBodyComponent";
import CullingComponent from "../templates/components/CullingComponent";
import UIComponent from "../templates/components/UIComponent";
import TerrainComponent from "../templates/components/TerrainComponent";
import LightComponent from "../templates/components/LightComponent";
import Component from "../templates/components/Component";


export default function getComponentInstance(key:string):Component|undefined{
    switch(key){
        case  COMPONENTS.LIGHT:
            return new LightComponent();
        case  COMPONENTS.MESH:
            return new MeshComponent();
        case  COMPONENTS.SKYLIGHT:
            return new SkyLightComponent();
        case  COMPONENTS.CAMERA:
            return new CameraComponent();
        case  COMPONENTS.SPRITE:
            return new SpriteComponent();
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
