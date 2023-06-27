/*global THREE Vue settings Terrain shuffleArray getRandom */
/*
 * A game to play with witch friends
 * Tap the fire to assign hats
 */

settings.scenes.blank = {
 
  // Custom controllable values go here

  setup() {
    console.log("Setup!");
    // Do something when we start this mode
  },

  
  step() {
    // Do something every n seconds
    // Not a good place to set Firebase data each frame,
    // that's a lot of read/write calls and could go past the free limit
  },

  setupAvatar(avatar) {

    // This doesn't work
    //  	avatar.hatColor = new THREE.Vector3(0, 0, 20)
    // We need to use Vue to make the color *reactive*
    // e.g. Vue.set(avatar, "hatColor", new THREE.Vector3(0, 0, 20));
    
  },
};

settings.activeSceneID = "blank";

/*==========================================================
 * Controls - for avatar creation or other interactions
 * Note that they disappear in VR mode!
 ==========================================================*/
Vue.component("blank-controls", {
  template: `<div>
    
	</div>`,
  props: ["userAvatar", "avatars", "settings"],
});

/*==========================================================
 * A scene 
 ==========================================================*/
Vue.component("blank-scene", {
  template: `
	  <a-entity id="blank-scene">
        <a-sky color="lightblue" />      
        <a-cylinder radius="6"  color="slategrey"  />
    </a-entity>`,

  methods: {
    
  },

  mounted() {},
  data() {
    // Additional data your scene might need
    return {};
  },
  props: ["avatars", "settings", "userAvatar"],
});

/*==========================================================
 * Each avatar 
 * The avatar doesn't get drawn for the player
 ==========================================================*/

// This pieces moves with their body position,
// ie, only if you move them
// or have a 6DoF headset, like the Quest
Vue.component("blank-avatar-body", {
  template: `<a-entity class="blank-body">
      
      <!-- feet -->
      
      <a-box 
        width=".2" height="2" depth=".3" 
        :color="avatar.color.toHSL({shade:.3})" 
        position="0 0 0" />
     
    </a-entity>
	`,
  data() {
    // Additional data your avatar's body might need
    return {};
  },
  props: ["avatar", "settings"],
});

// This piece moves with their head tilt
Vue.component("blank-avatar-head", {
  template: `
      <a-entity class="blank-head">
       
        <!-- HEAD -->
        <a-sphere 
          radius=".25"  
          :color="avatar.headColor.toHSL({shade:.4})" 
        />
        
        <!-- NOSE -->
        <a-cone 
          radius-bottom=".1" height=".2"  
          :color="avatar.headColor.toHSL({shade:-.6})" 
          scale="1 1 2"
          position="0 0 .2" />
          
       
    </a-entity>
	`,

  props: ["avatar", "settings"],
});

// This piece isn't moved at all
// You probably don't need to use it
Vue.component("blank-avatar-noposition", {
  template: `<a-entity class="blank-noposition">

  </a-entity>`,

  props: ["avatar", "settings"],
});

Vue.component("blank-avatar-hand", {
  template: `<a-entity class="blank-hand">
     <a-sphere 
        radius=".03"  
        :color="avatar.headColor.toHSL({shade:.4})" 
      />
  </a-entity>`,

  props: ["avatar", "settings", "side", "userAvatar"],
});
