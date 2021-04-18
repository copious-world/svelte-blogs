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

	let source_link
	$:  {
		if ( audio !== null ) {
			if ( typeof source === "string" ) {
				source_link = source
			} else {
				if ( media.protocol === "ipfs" ) {
					let a_cid = media.ipfs
					source_link = media_startup(audio,'audio','ipfs',a_cid,source)
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
