/*global THREE Vue noise avatars */

// Track the location of an avatar, and keep it synced to Firebase
// An avatar is a person in VR
// It might have movements either from synthdata or from human interaction
// It always has a head and head position

let avatarCount = 0;
class Avatar {
  constructor(data) {
    this.index = avatarCount++;

    // Identity
    this.role = -1;
    this.isUser = false;
    this.idNumber = Math.floor(Math.random() * 99999);
    // A temporary uid
    this.uid = "FK" + this.idNumber + "FK";

    
    // Keep all the THREE object references in case...
    this.threeObjs = {
      head: undefined,
      body: undefined,
    };
    this.color = new THREE.Vector3(Math.random() * 360, 100, 50);
    this.headColor = new THREE.Vector3(Math.random() * 360, 100, 50);
    this.hatColor = new THREE.Vector3(Math.random() * 360, 100, 50);
    this.brimColor = new THREE.Vector3(Math.random() * 360, 100, 50);
    this.bodyShape = "cone";
    this.shoeShape = "sneakers";
    

    // Position of the body in space
    this.pos = new THREE.Vector3();
    this.rot = new THREE.Vector3();
     
    // Head pos
    this.head = {
      rot: new THREE.Vector3(0, 0, 0),
      pos: new THREE.Vector3(0, 0, 0),
    };
    
    // Add to the list of avatars
    console.log(`Adding ${this} to list of avatars`, avatars)
    avatars.push(this);

    
    this.forwardVector = new THREE.Vector3();
    this.setFromData(data)
  }

  toString() {
    return this.uid.slice(-4);
  }

  moveAlongLineOfSight(amt) {}

  // Where is my head?
  // This is from the Cardboard/Quest *relative* to the current pos/rot
  get headRot() {
    // console.log(this.head.rot.toAFrame())
    return this.head.rot.toAFrame();
  }
  // get headPos() {
  //   return this.pos.toAFrame()
  // }

  get basePos() {
    if (!this.pos.toAFrame)
      console.warn("Invalid pos",this.pos)
    return this.pos.toAFrame();
  }

  get baseRot() {
    return this.rot.toAFrame();
  }

  autoMove(t) {
    let r = 10;
    let theta = 1 * noise(this.idNumber, t * 0.1) - 1.5;
    let y = 2 * noise(this.idNumber, t * 0.1 + 10) + 1;
    y = 0;

    // this.rot.y += .2*noise(this.idNumber, .2*t)

    let ry = 120 * noise(this.idNumber, 0.3 * t + 100);
    let rx = 20 * noise(this.idNumber, 0.23 * t + 100);
    this.head.rot.set(rx, ry);

    // this.pos.setToPolar({r, theta, y})

    // this.pos.addScaledVector (this.forwardVector, .01)
    // this.pos.y = 0
    // this.pos.multiplyScalar(.999)
  }

  setFromData(data) {
    /** 
    * Given some data (prob from a server), set this avatar to match it
    **/
    
    if (data) {
      // Set to this data
      let {pos,rot,head,headColor,color,hatColor,brimColor,bodyShape,shoeShape, ...toAssign} =data;
      Object.assign(this, toAssign);
        
        this.color.setFromData(data.color)
        this.headColor.setFromData(data.headColor)

        this.rot.setFromData(data.rot)
        this.pos.setFromData(data.pos)

        this.head.rot.setFromData(data.head?.rot)
        this.head.pos.setFromData(data.head?.pos)
        this.hatColor.setFromData(data.hatColor)
        this.brimColor.setFromData(data.brimColor)
        if (data.bodyShape) {
          this.bodyShape = data.bodyShape
        }
        if (data.shoeShape) {
          this.shoeShape = data.shoeShape
        }
      }
  }

  get serverData() {
    // Get head positions
    let data = {
      role: this.role,
      uid: this.uid,
      pos: this.pos.toAFrame(),
      rot: this.rot.toAFrame(),
      color: this.color.toAFrame(),
      headColor: this.headColor.toAFrame(),
      hatColor: this.hatColor.toAFrame(),
      brimColor: this.brimColor.toAFrame(),
      bodyShape: this.bodyShape,
      shoeShape: this.shoeShape
    };
    
    
   
    return data
  }
  
  updateHat(hex) {
    this.hatColor.fromHex(hex);
    this.pushToServer();
  }
  
  updateBrim(hex) {
    this.brimColor.fromHex(hex);
    this.pushToServer();
  }
  
  updateBody(type) {
    this.bodyShape = type;
    this.pushToServer()
  }
  
  updateShoes(type) {
    this.shoeShape = type;
    this.pushToServer()
  }
  
  pushToServer() {
    
    if (!this.isFake) {
      let data = this.serverData
      if (!(typeof data === 'object' && data !== null))
        throw(`AVATAR ${this} - Can't push non-object to server: ${data}`)

      this.ref.update(data)
    }
  }
  

  update(t) {
    // Copy the current orientation into the "forward vector"
    this.threeObjs.head?.getWorldDirection(this.forwardVector);
  }
}

Vue.component("avatar", {
  template: `<a-entity>


    
    <!-- the base part of the avatar -->
    <a-entity ref="base" 
     
      :position="avatar.basePos"  
      :rotation="avatar.baseRot" >

      <!-- forward marker -->
      <a-entity :position="avatar.forwardVector.toAFrame()" >
        <a-box v-if="false" color="green" /> 
      </a-entity>
      
      <!-- body to draw -->
      <!-- draw if not the user's avatar, or if it is, mirror it -->
      <a-entity
        :position="mirrorPos" :scale="mirrorScale">
      
        <!-- body -->
        <component :is="sceneID + '-avatar-body'" ref="body" 
         
          :avatar="avatar" :settings="settings"
        />

        <!-- ** the head part of the avatar ** -->
        <component :is="sceneID + '-avatar-head'" ref="head"
            :rotation="avatar.headRot"
            position="0 1.6 0"
            :avatar="avatar" :settings="settings"
          />
      </a-entity>
       

    </a-entity>

    <component :is="sceneID + '-avatar-noposition'" ref="noposition" 
      :avatar="avatar" :settings="settings" />

    <!-- HANDS -->
    <component :is="sceneID + '-avatar-hand'" 
      ref="hand-right" class="hand-right" side="right"         
      :avatar="avatar" :settings="settings" />
    <component :is="sceneID + '-avatar-hand'" 
      ref="hand-left" class="hand-left" side="left"          
      :avatar="avatar" :settings="settings"/>

    
  </a-entity>`,

  computed: {
    mirrorPos() {
      if (this.mirrorUser && this.avatar.isUser) {
        return "0 0 2";
      }
    },
    mirrorScale() {
      if (this.mirrorUser && this.avatar.isUser) {
        return "1 1 -1";
      }
    },
  },

  mounted() {
    this.avatar.threeObjs.head = this.$refs.head?.object3D;
  },
  props: ["avatar", "settings", "sceneID", "mirrorUser"],
});
