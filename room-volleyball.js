/*global THREE Vue settings Terrain shuffleArray getRandom */
/*
 * A game to play with laser friends
 * Click on friends to zap them
 */

settings.scenes.laser = {
  stepRate: 0.02,
  
//   sphereColor:"blue",
  
//   ambientLight: .3,
  // Custom controllable values go here

  setup() {
    console.log("Setup!");
    // Do something when we start this mode
  },

  // Do something every n seconds
  // Not a good place to set Firebase data each frame,
  // that's a lot of read/write calls and could go past the free limit
  step() {},

  setupAvatar(avatar) {
    Vue.set(avatar, "skirtLength", Math.random()*.7 + .4);
  },
};



/*==========================================================
 * Controls - for avatar creation or other interactions
 * Note that they disappear in VR mode!
 ==========================================================*/


/*==========================================================
 * A scene 
 ==========================================================*/
Vue.component("laser-scene", {
  template: `
	<a-entity id="laser-scene">


        <a-sky src="#beach" />
        
        <a-light position="0 3 3" type="point" :intensity="settings.ambientLight"  />
        <a-light position="0 3 -3" type="point" :intensity="settings.ambientLight" />
        <a-light type="ambient" intensity=".4" />

        <a-box 
          src = "#sand-diffuse" 
          normal-map= "#sand-normal" 
          depth="20" 
          height=".2" 
          width="20" 
          repeat='4 3'
          position="0 -.15 0"
          material="roughness:1"
          static-body />
          
        <a-box 
          src = "#sand-diffuse" 
          normal-map= "#sand-normal"
          depth=".4" 
          height=".2" 
          width="20.4"
          repeat='10 1'
          position="0 0 10"
          static-body />
          
        <a-box 
          src = "#sand-diffuse" 
          normal-map= "#sand-normal"
          depth="20.4" 
          height=".2" 
          width=".4"
          repeat='1 10'
          position="10 0 0"
          static-body />
          
        <a-box 
          src = "#sand-diffuse" 
          normal-map= "#sand-normal"
          depth=".4" 
          height=".2" 
          width="20.4"
          repeat='10 1'
          position="0 0 -10"
          static-body />
          
        <a-box 
          src = "#sand-diffuse" 
          normal-map= "#sand-normal"
          depth="20.4" 
          height=".2" 
          width=".4"
          repeat='1 10'
          position="-10 0 0"
          static-body />
        
        
        <a-sphere
          id="ball"
          ref="ball"
          v-bind:position="spherePosition"
          dynamic-body
          material="roughness:1"
          normal-scale= "1.0 1.0"
          shadow="receive: true"
          normal-map= "#beachball-normal"
          src="#beachball-diffuse"/>
          
        <!-- CENTRAL PIECE -->
         <a-box        
           position="0 0 -1"
           scale="1 1 1"
           :rotation="'0 0 0'"
           shadow="receive: true"
           src= "#sand-diffuse"
           static-body></a-box>
          <a-box        
           position="0 0 -1"
           scale="1 1 1"
           :rotation="'23 0 23 '"
           shadow="receive: true"
           src= "#sand-diffuse"
           static-body></a-box>
          <a-box
           position="0 0 -1"
           scale="1 1 1"
           :rotation="'72 0 23 '"
           shadow="receive: true"
           src= "#sand-diffuse"
           static-body></a-box>
          
    </a-entity>`,

  methods: {
    
  },
  
  mounted() {
    setInterval(() => {
      var el = document.querySelector('#laser-scene').querySelector('#ball');
      if (el.getAttribute('position').y <= 1.1) {
        console.log("AVATARS:" + JSON.stringify(this.avatars));
        const randomAvatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
        const pos = randomAvatar.pos;
        const ballRespawnX = pos.x;
        const ballRespawnZ = pos.z;
        // respawn y should be the same each time
        const ballRespawnY = this.spherePositionObject.y;
        
        const displacementX = Math.random();
        const displacementZ = Math.random();
        
        // update the new ball position to the firebase under /respawn
        // ?? push
        
        const respawnLoc = {x: ballRespawnX + displacementX, y: ballRespawnY, z: ballRespawnZ + displacementZ};
        //IO.pushRespawn(respawnLoc);
        
        el.setAttribute('position', respawnLoc);
        el.components["dynamic-body"].syncToPhysics();
      }
    }, 50);
  },
  computed: {
    
    
  },
  data() {
    return {
      // hatSpheres: [],
      // terrain: new Terrain(),
      spherePosition: "0 7 1.5",
      spherePositionObject: { x: 1, y: 7, z: 1.5 }
    };
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
Vue.component("laser-avatar-body", {
  template: `<a-entity class="laser-body">
      
      
      <!-- legs -->
      <a-cylinder 
        radius=".07" height="1" 
        :color="avatar.color.toHSL({shade:-.5})" 
        position="0.1 .5 0"   />
      <a-cylinder 
        radius=".07" height="1" 
        :color="avatar.color.toHSL({shade:-.5})" 
        position="-0.1 .5 0"   />
        
        
      
     
      <!-- feet -->
      <a-entity class="laser-feet">
        <template v-if="avatar.shoeShape === 'sneakers'">
          <!-- SNEAKERS -->
          <a-box 
            width=".15" height=".1" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="0.1 0 0"
            static-body/>
          <a-box 
            width=".15" height=".1" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="-0.1 0 0"
            static-body/>
        </template>
        
        <template v-else-if="avatar.shoeShape === 'heels'">
          <!-- HIGH HEELS -->
          <a-box 
            width=".15s" height="0.1" depth="0.4" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="0.1 0.1 0.1" 
            rotation="45 0 0"
            static-body/>
          <a-box 
            width=".15" height="0.1" depth="0.4" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="-0.1 0.1 0.1"
            rotation="45 0 0"
            static-body/>
          <a-box 
            width=".15" height=".15" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="0.1 0.1 0" 
            rotation="90 0 0"
            static-body/>
          <a-box 
            width=".15" height=".15" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="-0.1 0.1 0"
            rotation="90 0 0"
            static-body/>
        </template>
        
        <template v-else-if="avatar.shoeShape === 'platforms'">
          <a-box 
            width=".15" height=".3" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="0.1 0 0" />
          <a-box 
            width=".15" height=".3" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="-0.1 0 0"
            static-body/>
        </template>
        
        <template v-else>
          <a-box 
            width=".15" height=".1" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="0.1 0 0"
            static-body/>
          <a-box 
            width=".15" height=".1" depth=".3" 
            :color="avatar.color.toHSL({shade:.3})" 
            position="-0.1 0 0"
            static-body/>
        </template>
      </a-entity>
        
        
         
    <a-entity class="laser-body">
      <template v-if="avatar.bodyShape === 'rectangle'">
        <!-- Render rectangle body here -->
        <a-box width=".6" :height="avatar.skirtLength" depth=".3" position="0 1 0" :color="avatar.color.toHSL({shade:.3})" />
      </template>
      <template v-else-if="avatar.bodyShape === 'cone'">
        <!-- Render cone body here -->
        <a-cone width=".6" :height="avatar.skirtLength" depth=".3" position="0 1 0" radius-top=".1" radius-bottom=".4" :color="avatar.color.toHSL({shade:.3})" />
      </template>
      <template v-else-if="avatar.bodyShape === 'sphere'">
        <!-- Render sphere body here -->
        <a-sphere radius="0.4" position="0 1 0" :color="avatar.color.toHSL({shade:.3})" />
      </template>
      <template v-else>
        <a-cone 
          width=".6" :height="avatar.skirtLength" depth=".3" 
          radius-top=".1"
          radius-bottom=".4"
          :color="avatar.color.toHSL({shade:.3})" 
          position="0 1 0" />
      </template>
    </a-entity>
        

    </a-entity>
	`,
  props: ["avatar", "settings"],
});

// This piece moves with their head tilt
Vue.component("laser-avatar-head", {
  template: `<a-entity class="laser-body">
        <!-- HAIR -->
       <a-sphere 
          radius=".28"  
           position="0 .05 -.1"
          :color="avatar.headColor.toHSL({shade:.2})"
          />
          
        <!-- HEAD -->
        <a-sphere 
          radius=".25"  
          :color="avatar.headColor.toHSL({shade:.4})"
        />
        
        <!-- NOSE --> 
        <a-cone 
          radius-bottom=".1" height=".2"  
          :color="avatar.headColor.toHSL({shade:-.6})" 
          scale="2 2 3"
          position="0 .1 .1" />
          
        <!-- HAT -->
        <a-sphere :color="avatar.hatColor.toHSL({shade:.2})" position="0 .45 0" radius=".5"
            theta-length = 90 static-body/>
        <a-cylinder :color="avatar.hatColor.toHSL({shade:.2})" radius="1" height= .1 position="0 0.44 0" rotation="0 0 0" static-body/>
        <a-torus :color="avatar.brimColor.toHSL({shade:0})" rotation="90 0 180" radius=".85" position="0 0.45 0" radius-tubular="0.08" static-body/>

    </a-entity>
	`,
  
  mounted() {
    setInterval(() => {
      //console.log("Current Hat Color (Avatar): " + this.avatar.hatColor)
      //console.log("Current Hat Color (Settings): " + this.settings.hatColor)
    }, 1000);
  },
  
  props: ["avatar", "settings"],
});

// This piece isn't moved at all
// You probably don't need to use it
Vue.component("laser-avatar-noposition", {
  template: `<a-entity>

  </a-entity>`,

  props: ["avatar", "settings"],
});

/*
Vue.component("laser-avatar-hand", {
  template: `<a-entity>
     <a-sphere 
        radius=".03"  
        :color="avatar.headColor.toHSL({shade:.4})" 
      />
  </a-entity>`,

  props: ["avatar", "settings", "side", "userAvatar"],
});
*/