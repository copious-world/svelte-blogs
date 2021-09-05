<script context="module">
	let current;
</script>

<script>
	export let poster
	export let source
	export let ipfs
	//
	// These values are bound to properties of the video
	//let time = 0;
	//let duration;
	let paused = true;
	let audio;

	let a_cid
	$: a_cid = ipfs

	let a_poster_cid
	let source_counter = false
	$: a_poster_cid = poster && poster.protocol ? poster.cid : false

	let source_link = ""
	$:  {
		if ( audio !== null ) {
			if ( source && (typeof source !== "string") && source._x_link_counter ) {
				source_counter = source._x_link_counter
			}
			figure_source_link(source_counter)
		}
	}

	async function figure_source_link(scounter) {
		source_link = await media_startup(audio,'audio','ipfs',a_cid,source,scounter)
	}

	function stopOthers() {
		if (current && current !== audio) current.pause();
		current = audio;
	}

</script>

<style>
	div {
		position: relative;
	}

</style>

<div>
	<audio bind:this={audio} controls controlsList="nodownload"  
								on:play={stopOthers} 
								bind:paused  >
		<source src="{source_link}" type="audio/ogg">
		<source src="{source_link}" type="audio/mpeg">
		Your browser does not support the audio element.
	</audio>
</div>
