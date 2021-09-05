<script context="module">
	let current;
</script>

<script>
	export let media

	let poster
	let source

	$: poster = media.poster
	$: source = media.source

	// These values are bound to properties of the video
	//let time = 0;
	//let duration;
	let paused = true;
	let audio;

	let poster_link
	let poster_counter = false
	$: {
		if ( poster && poster._x_link_counter ) {
			poster_counter = poster._x_link_counter
		}
		let name = poster.name
		poster_link = media_startup(false,'images','local',name,poster_counter)
	}


	let source_link
	let source_counter = false
	$:  {
		if ( audio !== null ) {
			if ( source && (typeof source !== "string") && source._x_link_counter ) {
				source_counter = source._x_link_counter
			}
			if ( typeof source === "string" ) {
				source_link = source
			} else {
				if ( media.protocol === "ipfs" ) {
					let a_cid = media.ipfs
					source_link = media_startup(audio,'audio','ipfs',a_cid,source,source_counter)
				}
			}
		}
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
	<audio controls controlsList="nodownload"  on:play={stopOthers} 
							bind:this={audio}
							bind:paused  >
		<source   src="{source_link}" type="audio/ogg">
		<source src="{source_link}" type="audio/mpeg">
		Your browser does not support the audio element.
	</audio>
</div>
