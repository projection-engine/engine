export default `
 // You can also declare functions outside class
 class MyComponent extends Component {
     myNumber = 10
     
     // Declare initial attributes here
     constructor(entity){
         super()
         // Executed on first frame update
     }
     onUpdate(){
         console.log(this.entity) // You can access the entity itself via the private entity
         // executed every frame  
     }
     
     // Component metadata
     _icon = "category" // Material icon representing component (icon name) (https://fonts.google.com/icons?selected=Material+Icons+Round)
     _name = "My component" // Ideally unique
     _props = [
         Component.number("My example input", "myNumber")
     ]
 }
 
 return MyComponent // Required return statement for class reference
 `