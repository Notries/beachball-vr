// *CREDITS*
// Avatar utilities, IO class and functions taken from starter code by Professor Kate Compton.
// Firebase configuration imported by Francis Brenner and Connor Morikawa.
// Minor bugfixes to IO class for Google Cardboard compatibility by Francis Brenner.
/////////////////////

/*global uuidv4 firebase Avatar THREE Vue settings Terrain shuffleArray getRandom */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAGUMspOyTdzAVnlu98PhJ7Ouv8Z47SZ4",
  authDomain: "beachvolleyballvr.firebaseapp.com",
  databaseURL: "https://beachvolleyballvr-default-rtdb.firebaseio.com",
  projectId: "beachvolleyballvr",
  storageBucket: "beachvolleyballvr.appspot.com",
  messagingSenderId: "780105284755",
  appId: "1:780105284755:web:c1dcf16fab89711afce166"
};

const MIN_UPDATE_TURN = 0.01;

//==============================================
// Query parameters, useful for adding in variables based on a url
// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
const PARAMS = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

function parseVector(v) {
  if (typeof v === "string" || v instanceof String) {
    return new THREE.Vector3(...v.split(" ").map((x) => parseFloat(x)));
  }
  if (Array.isArray(v) && v.length === 3 && typeof v[0] === "number")
    return new THREE.Vector3(...v);
  if (typeof v === "object" && v.x !== undefined) {
    return new THREE.Vector3(v.x, v.y, v.z);
  }

  console.warn("unknown", v, typeof v);
}

//=========================================================================
// AVATAR UTILITIES

function getPositionByRoleIndex(roleIndex) {
  let theta = roleIndex;
  let r = 3 + roleIndex * 0.1;
  return {
    scale: 1,
    pos: new THREE.Vector3().addPolar({ r, theta, y: 0 }),
    rot: new THREE.Vector3(0, (-theta * 180) / Math.PI - 90, 0),
  };
}

// Use this later for people!
let avatars = [];
let userAvatar = new Avatar({
  isUser: true,
});

function setupAvatars() {
  // Set up a loop to move the avatars
  setInterval(() => {
    let t = Date.now() * 0.001;
    // Move all the fake avatars
    if (IO.avatarMotion === "automove")
      avatars.filter((a) => a.isFake).forEach((a) => a.autoMove(t));
  }, 40);
}

function createFakeAvatars() {
  let fakeCount = PARAMS.fakecount;
   if (settings.ioPrint)
      console.log(`IO - create ${fakeCount} fake avatars for testing`);
  // Create some default avatars
  for (var i = 0; i < fakeCount; i++) {
    let a = new Avatar({
      isFake: true,
    });
  }
}

//---------------------------------------------------------

function getRoleList(avatars) {
  // Role maintenence
  // Figure out which roles are currently occupied and by whom

  let roles = Array(IO.avatarMaxCount).fill(undefined);
  avatars.forEach((a) => {
    if (a.role !== undefined) roles[a.role] = a;
  });
  return roles;
}

function getEmptyRoles(avatars) {
  // https://stackoverflow.com/questions/71030467/find-list-of-empty-indices-in-a-javascript-array
  return getRoleList(avatars).reduce((acc, curr, index) => {
    if (curr === undefined) acc.push(index);
    return acc;
  }, []);
}

//=========================================================================
// IO stuff

let IO = {
  db: undefined,

  avatarMotionOptions: ["automove", "mirroruser", "live"],
  avatarMotion: PARAMS.avatars?.toLowerCase() || "live",
  avatarMaxCount: 40,

  // Get the user's unique identifier (or create one)
  userID: PARAMS.uid || uuidv4(),
  // Get the id for this room
  roomID: PARAMS.room || "test",

  get activeScene() {
    return settings.scenes[settings.activeSceneID];
  },

  setup() {
    console.log(`IO - setup, userID ${IO.userID}`);
    setupAvatars();
  },

  // The position of the camera *relative to the starting position*
  // ...because AFrame is weird about repositioning the user
  camera: {
    rot: new THREE.Vector3(0, 0, 0),
    pos: new THREE.Vector3(0, 0, 0),
    dir: new THREE.Vector3(0, 0, 0),
    rotServer: new THREE.Vector3(0, 0, 0),
    posServer: new THREE.Vector3(0, 0, 0),
    dirServer: new THREE.Vector3(0, 0, 0),

    // Watch the camera movement, and let the server know
    updateFromCameraObject(camObj) {
      // Convert to degrees, and flip X, I guess?
      this.rot.copy(camObj.rotation).multiplyScalar(180 / Math.PI);
      this.rot.x *= -1;
      this.rot.z *= -1;

      this.dir.copy(this.rot.convert360RotationToDirection());
      let d = this.dir.distanceTo(this.dirServer);

      // Did you move enough to need to post an update to the server?
      if (d > MIN_UPDATE_TURN) {
        // console.log(d)
        this.dirServer.copy(this.dir);

        let rText = this.rot.toAFrame();
        userAvatar.ref.child("head/rot").set(rText);
      }

      if (IO.avatarMotion === "mirroruser") {
        avatars.forEach((a) => {
          a.head.rot.copy(IO.camera.rot);
        });
      }
    },
  },

  enterRoom() {
    // Try to enter this room by connecting to firebase and subscribing to avatars
    // Make sure we have a firebase connection
    // Make sure we haven't entered this room before

    let appSettings = settings.scenes[settings.activeSceneID];
    let appID = settings.activeSceneID;
    let roomID = IO.roomID;
    let userID = IO.userID;

    // Clear all the avatars
    avatars.splice(0, avatars.length);
    // but keep me
    avatars.push(userAvatar);

    console.log(
      "-------------\n" + `IO - enter room - app:'${appID}', room:'${roomID}'`
    );

    // Setup all references
    IO.roomRef = firebase.database().ref(`${appID}/rooms/${roomID}`);
    IO.roomDataRef = IO.roomRef.child(`data`);
    IO.usersRef = IO.roomRef.child(`users`);

    // Subscribe to room changes
    IO.roomDataRef.on("value", (snapshot) => {
      let data = snapshot.val();
      // console.log("IO - roomData changed", data);
      // Object.assign(value)
      setFromServerData(IO.activeScene.roomData, data);
    });

    // Send this avatar to the server, with the correct userID
    userAvatar.uid = this.userID;
    userAvatar.ref = IO.roomRef.child(`users/${userID}`);
    userAvatar.pushToServer();

    // Delete me when I exit
    userAvatar.ref.onDisconnect().remove();
    
    // subscribe
    // if (appSettings.subscribeToUserAvatar)
    IO.subscribeToAvatar(userAvatar)

    // Deal with everyone already here, so I can figure out my role
    IO.usersRef.get().then((snapshot) => {
      // First, get all the real people in the room
      let startingAvatars = Object.values(snapshot.val()).filter((a) => a.uid);

      if (settings.ioPrint) {
        console.log("  current members: ");
        startingAvatars.forEach((a) =>
          console.log(`   - ${a.uid.slice(-4)} (role:${a.role})`)
        );
      }

      // Create any fake ones afterward
      createFakeAvatars();

      // Give roles to everyone that doesn't have one yet,
      // like the user who just joined, and all the fakes
      let roles = getEmptyRoles(startingAvatars);
      // shuffleArray(roles);

      let posFxn = appSettings.getPositionByRoleIndex || getPositionByRoleIndex;

      avatars.forEach((a) => {
        if (a.role < 0) {
          let role = roles.shift();
          let pos = posFxn(role);
          a.setFromData({
            ...pos,
            role,
          });
          // console.log(`   - assigned role:${role} to ${a}`, pos);
        }
      });

      // Send our new position and role to the server
      userAvatar.pushToServer();
     
      //
    });

    // Listen for new avatars
    // When we hear about a new avatar's data,
    // check to see if we should add one to our list
    IO.usersRef.on("child_added", (snapshot) => {
      let uid = snapshot.key;
      let data = snapshot.val();
      if (settings.ioPrint)
        console.log(`IO - new avatar appears on Firebase: ${uid.slice(-4)}`);
      this.addAndSubscribeToAvatar(uid, data);
    });

    IO.usersRef.on("child_removed", (snapshot) => {
      let uid = snapshot.key;
      if (settings.ioPrint)
        console.log(`IO - avatar leaves on Firebase: ${uid.slice(-4)}`);
      // This avatar was removed
      let index = avatars.findIndex((a) => a.uid === uid);
      console.log("Remove at ", index);
      avatars.splice(index, 1);
    });
  },

  addAndSubscribeToAvatar(uid, data) {
    if (settings.ioPrint) console.log(`IO - Add new avatar ${uid.slice(-4)}`);
    if (IO.getAvatar(uid)) {
      // Already got this one
      return;
    }

    let avatar = new Avatar({
      uid,
      ...data,
    });

    IO.subscribeToAvatar(avatar)
  },
  
  subscribeToAvatar(avatar) {
    // Subscribe to this avatar's FB info
    avatar.ref = IO.usersRef.child(avatar.uid);
    // When it changes, change this Avatar
    avatar.ref.on("value", (snapshot) => {
      let val = snapshot.val();
      if (val === null) {
        if (settings.ioPrint) console.log(`IO - ${avatar} left`);
      } else {
        avatar.setFromData(val);
      }
    });
  },

  assignRole(a, role) {
    if (role === undefined) {
      role = getRandom(IO.getEmptyRoles());
    }
    console.log(`Assign role ${role} to ${a}`);
    a.setFromData({
      role,
      ...IO.getPositionByRole(role),
    });
  },
  pushAvatarDataToServer(a) {
    let data = a.serverData;
    if (settings.ioPrint)
      console.log(`IO - send avatar data for ${a} to server`, data);
    IO.usersRef.child(a.uid).update(data);
  },

  getPositionByRole(roleIndex) {},

  getAvatar(uid) {
    return avatars.find((a) => a.uid === uid);
  },

  pushRoomDataToServer() {
    let roomData = IO.activeScene.roomData;

    if (!roomData) {
      throw "IO - pushRoomDataToServer got no data as argument";
    }
    if (settings.ioPrint)
      console.log("IO - send roomData  to server", roomData);

    IO.roomDataRef.update(roomData);
  },

  getPositionByRole(roleIndex) {},

  getAvatar(uid) {
    return avatars.find((a) => a.uid === uid);
  },
};

try {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log("FIREBASE INIT!");

  // Create the database
  IO.db = firebase.database();
} catch (err) {
  console.warn("Can't connect to firebase");
}

function setFromServerData(obj, data) {
  if (!obj) {
    throw "No obj yet";
  }

  if (!data) {
    throw "No data yet";
  }

  // Go through all the data and update this object in a Vue-safe way
  Object.keys(data).forEach((key) => {
    let target = obj[key];
    let val = data[key];

    //     console.log(" _ ", key, target, val, typeof target);

    if (Array.isArray(target)) {
    } else if (target?.copy) {
      target.copy(val);
    } else if (typeof target == "object") {
      // object
    } else {
      // everything else (numbers, bools, strings) can be copied
      Vue.set(obj, key, val);
    }
  });
}
