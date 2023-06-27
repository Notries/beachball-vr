
# A6: Social VR Space

# To build: create a unique game room

Like the last assignment, create a `room-mygame.js` with a `settings.scenes.mygame` object in it to track all your data for this room.  Add `setupAvatar` to it, which is used to set up new avatars by adding data when they come in.
Dr Kate will handle the code for synchronizing avatar heads as people join the room. You can currently develop it in single-player mode with fake avatars, I'll send an announcement when we can send data across Firebase.
   
### Make custom Vue components for:

* mygame-avatar-controls: controls for letting the user change their appearance
* mygame-avatar-scene: the scene you are in
* mygame-avatar-body: an avatar's body (this will stay in position unless they move via Quest or other input)
* mygame-avatar-head: an avatar's head (will rotate with 3DoF, e.g. Cardboard tilt control)
* mygame-avatar-hand: hands (if you have them as controllers, only in Quest)

### Requirements: 

* The avatars must look *interesting* (and appropriate for your scene) 
  * ...and be significantly different from the in-class examples
  * You can keep the multicolored sphere-head-with-nose if you want, but should change the rest at minimum
  * And you are encouraged to make completely new geometry 
    * "all the avatars are pianos with top hats" 
    * "avatars have giant googly eyes"... "some have many eyes"... "the eyes 'blink'"
    * "avatars are spheres with animated slices taken out via phi_length, to make 3D Pacman heads that 'talk' etc
* The player can "dress up" their avatar using the control panel (see examples) with at least three controls
* Create a way for players to move around the scene, at least a bit 
  * Some options: 
    * click on an object to teleport to it
    * move in the direction you are looking when holding the button
    * move forward automatically in the direction you are looking
  * Remember that Cardboard players only have tilt and one-button press!
  * Make sure you use good practices from the reading to prevent motion sickness!
* There should be an interesting scene for us to be in. You can use any of your A5 work too!
  * You aren't required to have scene controls, too, but it may be helpful
* Design at least two things for your users to talk about in your app.  These may be two parts of a finished "game" or activity, or just two unrelated things
  * a "cheese plate": an object that your players can interact by "clicking" on the geometry (remember, no HTML controls in VR mode!)
    * "clicking the tv changes the texture so we can argue over what to pretend 'watch'"
    * "a fire that users can click to make bigger and brighter"
    * "targets that users can shoot to get points"
    * "a physics-based soccer ball that we can push around"
    * "hats that we are wearing that change color if you click each other"
    * "a piano that you can click to play random notes"
  * a "chat pet": something that happens at different times
    * "clicking the skybox switches from beach mode to ski mode"
    * "a cat that wanders into the scene sometimes that you can pet"
    * "a 'party mode' with light and music that you can trigger with a switch (or timer)"
    * "a timed mode where the more you move your head, the bigger your eyes get"
    * "a meteorite shower that only happens sometimes, and you can click them to make a wish"

**Strongly-recommended:** 

* Use your own Firebase realtime database (safer and more controllable) rather than the example one
* Install [this Chrome plugin](https://chrome.google.com/webstore/detail/webxr-api-emulator/mjddjgeghkdijejnciaefnkjmkafnnje
) to be able to control a fake "VR headset"


# Useful components and functions

* Querystring flags for debugging:
  * `mode=witch` - specify the room mode to enter
  * `room=testroom1234` - specify a particular room ID to enter
    * to have multiple Jackbox "rooms" with limited players
    * room ID is "test" by default
  * `avatars=mirroruser`  - move the other avatars' heads to mirror the user
  * `avatars=automove` - move the other avatars' heads around automatically
  * `mirror=true` - start in mirroring mode (ie, you can see your avatar)

You have access to "settings" (your custom settings) and "avatars" (list of all player avatars in the room) and "userAvatar" (the avatar for the person on this device, "you")

Events for 3D objects, these are [custom A-Frame events](https://aframe.io/docs/1.4.0/introduction/interactions-and-controllers.html) that works like event handlers in normal JS
click, mouseenter, mouseleave, touchstart, touchend

### THREE.Vector3 functions
All the [normal Vector3 methods](https://threejs.org/docs/#api/en/math/Vector3) are available. I also added a couple of useful ones

If you create a color as a THREE.Vector3(300, 100, 50) (bright magenta in HSL), they you can use `myColor.toHSL()` to turn it to "hsl(300, 100%, 50%)" which is usable as a color in CSS or AFrame. `myColor.toHSL({shade:.5})` makes it lighter, `myColor.toHSL({shade:-.5})` makes it darker, useful for making objects with many tints of the same color

`myVec.setToPolar({r, theta, y})` will set a THREE vector to a polar coordinate *around the Y axis* useful because Y is up) `myVec.addPolar({r, theta, y})` will do the same, but add it to its existing value.


`myVec.toAFrame()` will convert a THREE vector to the AFrame style of "0 50 40" (etc).  Useful for printing data as well as quickly creating positions and rotations for dynamic objects.


### colorchangers

Want to change a model color? This will print out a list of all the submodels (in this case "Node-Mesh" and "Node-Mesh_1") 

`<a-entity gltf-model="#wizardhat" ref="hat" colorchanger />`
        
...and has a "changeColor" function to call later in Javascript. You can pass an object mapping the submodel names to the new colors for them.  Notice that I'm using "$refs" to find objects by their reference ID       
```
this.$refs.hat.changeColor({
    'Node-Mesh':this.avatar.hatColor.toHSL(),  
    // toHSL: Converts from a 3D vector color to a CSS string
    // and can include {shade, fade} to lighten/darken or desaturate
    // {shade:.9} go almost to white {shade:-.9} go almost to black
    'Node-Mesh_1':this.avatar.hatColor.toHSL({shade:-.3})
  })
```


Assets used in demo:

Wizard hat by Poly by Google [CC-BY] via Poly Pizza
Fish byQuaterniusvia Poly Pizza
Jellyfish by Poly by Google [CC-BY] via Poly Pizza
Piano by Bruno Oliveira [CC-BY] via Poly Pizza
