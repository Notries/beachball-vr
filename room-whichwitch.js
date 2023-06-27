/*global THREE Vue settings Terrain shuffleArray getRandom */
/*
 * A game to play with witch friends
 * Tap the fire to assign hats
 */

settings.scenes.witch = {
  stepRate: 0.02,
  
  sphereColor:"blue",
  
  ambientLight: .3,
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
    // Start evenyone with a black hat

    // This doesn't work
    //  	avatar.hatColor = new THREE.Vector3(0, 0, 20)
    // We need to use Vue to make the color *reactive*
    Vue.set(avatar, "hatColor", new THREE.Vector3(0, 0, 20));
    Vue.set(avatar, "hatHeight", 1);
    Vue.set(avatar, "skirtLength", Math.random()*.7 + .4);
    
  },
};

// settings.activeSceneID = "witch";

/*==========================================================
 * Controls - for avatar creation or other interactions
 * Note that they disappear in VR mode!
 ==========================================================*/
Vue.component("witch-controls", {
  template: `<div>
      <div>
        Scene controls
        light:<input v-model="settings.ambientLight" type="range" min="0" max=".5" step=".02"/>
      </div>
      <!-- custom avatar controls -->
       <div>
       
         Character maker
         <div>
            skirt:<input v-model="userAvatar.skirtLength" type="range" min=".7" max="1.5" step=".02"/>
         </div>
         <div>
            hat:<input v-model="userAvatar.hatHeight" type="range" min=".5" max="1.5" step=".02"/>
         </div>
        
      </div>
	</div>`,
  props: ["userAvatar", "avatars", "settings"],
});

/*==========================================================
 * A scene 
 ==========================================================*/
Vue.component("witch-scene", {
  template: `
	<a-entity id="witch-scene">
		<a-entity position="0 0 -2" text="font: https://cdn.aframe.io/fonts/mozillavr.fnt; value: Via URL."></a-entity>

        <a-sky src="#nightsky" />
        
        <a-light position="0 3 3" type="point" :intensity="settings.ambientLight"  />
        <a-light position="0 3 -3" type="point" :intensity="settings.ambientLight" />
        <a-light type="ambient" color="violet" intensity=".4" />

        <a-plane width="90" height="90" rotation="-90 0 0" color="slategrey " />
        <terrain :terrain="terrain" />
        
        <!-- PIANO -->
        <a-entity position="0 1 -4">
         <a-entity gltf-model="#piano" 
         @click="clickPiano"
          ref="piano" 
          
          colorchanger
          color="blue"
           />
           
           <a-sphere position="0 1 0" :color="settings.sphereColor" />
          
        </a-entity>
           

        <a-sphere  theta-start="0"  color="DarkSlateGray"  theta-length="30" side="double" radius="1.5"  position="0 -1.45 0" scale="6 1 6"/>
         <a-entity class="cauldron" @click="cauldronClick">
         <a-torus  color="black" radius=".9" radius-tubular=".05" rotation="90 0 0" position="0 .6 0"/> 
         <a-sphere  theta-start="-180"  color="grey"  theta-length="120" side="double" radius=".5"  position="0 .4 0" scale="2 1 2"/>
        </a-entity>

        <a-entity>
        	<a-entity v-for="(sphere,index) in hatSpheres" >
        		<!-- click a color to guess it -->
        		<a-sphere :color="sphere.color.toHSL()" 
        			:position="sphere.pos.toAFrame()" 
        			:radius="sphere.points*.06 + .03" 
        			@click="guessColor(sphere)" />
        	</a-entity>	

        </a-entity>


        

    </a-entity>`,

  methods: {
    
    clickPiano() {
      console.log("CLICK PIANO")
      // Get piano object
      this.$refs.piano.changeColor({
        "Node-Mesh_5": "magenta",
        "Node-Mesh": "magenta"
      }) 
      
    },
    
    guessColor(sphere) {
      console.log(sphere);
      console.log(`You guess ${sphere.color.toAFrame()}`);

      // Is this my hat color?

      const d = sphere.color.distanceTo(this.userAvatar.hatColor);
      let c0 = sphere.color.toAFrame();
      let c1 = this.userAvatar.hatColor.toAFrame();
      console.log("Guess:", c0, "Yours:", c1);
      if (d < 10) {
        console.log("RIGHT");
      } else {
        console.log("WRONG");
      }
    },

    cauldronClick() {
      console.log("START THE GAME");

      // Make a random list of colors
      // and assign one to each player
      let possibleColors = [
        new THREE.Vector3(100, 0, 90),
        new THREE.Vector3(100, 0, 10),
        new THREE.Vector3(320, 100, 50),
        new THREE.Vector3(220, 100, 50),
      ];

      this.avatars.forEach((a) => (a.hatColor = getRandom(possibleColors)));

      // Make clickable spheres
      let spheres = this.avatars.map((a, index) => {
        return {
          color: a.hatColor,
          pos: new THREE.Vector3(0, 0.7 + 0.6 * index, 0),
          points: 5,
        };
      });
      shuffleArray(spheres);
      this.hatSpheres = spheres;
      console.log(
        "Secret hat colors",
        this.hatSpheres.map((s) => s.pos.toAFrame())
      );
    },
  },

  mounted() {},
  data() {
    return {
      hatSpheres: [],
      terrain: new Terrain(),
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
Vue.component("witch-avatar-body", {
  template: `<a-entity class="witch-body">
      <a-cone 
        width=".6" :height="avatar.skirtLength" depth=".3" 
        radius-top=".1"
        radius-bottom=".4"
        :color="avatar.color.toHSL({shade:.3})" 
        position="0 1 0" />
      
      <!-- legs -->
      <a-cylinder 
        radius=".12" height="1" 
        :color="avatar.color.toHSL({shade:-.5})" 
        position="0 .5 0"   />
     
      <!-- feet -->
      <a-box 
        width=".3" height=".1" depth=".4" 
        :color="avatar.color.toHSL({shade:.3})" 
        position="0 0 0" />

    </a-entity>
	`,
  props: ["avatar", "settings"],
});

// This piece moves with their head tilt
Vue.component("witch-avatar-head", {
  template: `<a-entity class="witch-body">
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
          scale="1 1 2"
          position="0 0 .2" />

        <a-entity gltf-model="#wizardhat" 
          ref="hat"
          colorchanger :scale="hatScale" />
          </a-entity>
       
    </a-entity>
	`,
  
  computed: {
    hatScale() {
      
      let s = `.3 ${.3*this.avatar.hatHeight} .3`
      // console.log("HAT SCALE", s)
      return s
    }
  },

  mounted() {
    // setTimeout(() => {
    // 	this.changeHatColor()
    // }, 100)
  },

  watch: {
    // If the hat color changes, call the function to change the hat color
    "avatar.hatColor"() {
      console.log("Hat color changed", this.avatar.hatColor);
      this.changeHatColor();
    },
  },

  methods: {
    changeHatColor() {
      // If we want to change the color of a model and not a a-frame geometry
      // we have to call a function
      // "ref" allows us to access a particular part of a scnee

      // Each model may have different components,
      // this lets us set them to different colors
      if (this.$refs.hat.changeColor) {
        this.$refs.hat.changeColor({
          "Node-Mesh": this.avatar.hatColor.toHSL(),
          // toHSL: Converts from a 3D vector color to a CSS string
          // and can include {shade, fade} to lighten/darken or desaturate
          // {shade:.9} go almost to white {shade:-.9} go almost to black
          "Node-Mesh_1": this.avatar.hatColor.toHSL({ shade: -0.3 }),
        });
      }
    },
  },

  props: ["avatar", "settings"],
});

// This piece isn't moved at all
// You probably don't need to use it
Vue.component("witch-avatar-noposition", {
  template: `<a-entity>

  </a-entity>`,

  props: ["avatar", "settings"],
});

Vue.component("witch-avatar-hand", {
  template: `<a-entity>
     <a-sphere 
        radius=".03"  
        :color="avatar.headColor.toHSL({shade:.4})" 
      />
  </a-entity>`,

  props: ["avatar", "settings", "side", "userAvatar"],
});
