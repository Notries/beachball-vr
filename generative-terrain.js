
/*
 * A sample class for generating some terrain
 *  from lots of cubes
 * MODIFY IT IF USING IT YOURSELF!!!!
 */

Vue.component("terrain", {
	template: `<a-entity class="terrain">
		<a-box 
			v-for="(b,index) in terrain.boulders"
			:key="index"
			:color="b.color.toHSL()" :width="b.size" :height="b.size*2"  :depth="b.size" 
			:rotation="b.rot.toAFrame()"
			:position="b.pos.toAFrame()"></a-box>
		
	</a-entity>`,

	props: ["terrain"]
})

class Terrain {
	constructor() {
		let count = 50; 
		this.boulders = []
		for (var i = 0; i < count; i++) {
			let y = i*.3
			let r = 10 + Math.random()*10
			let theta = .4*i
			let color =  new THREE.Vector3(40 + Math.random()*30, 10, 20 + Math.random()*30)
			let pos = new THREE.Vector3().addPolar({r, theta, y})
			let size = .2*(Math.random()*1 + 1)*r - i*.02
			// console.log(size)
			let rot = new THREE.Vector3(Math.random()*1, Math.random()*100, Math.random()*300)
			this.boulders.push({
				color,
				pos,
				rot,
				size
			})
			// console.log(color, color.toHSL())
		}
	}
}