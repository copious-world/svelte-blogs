<script context="module">
	let current;
</script>

<script>
	export let media

	let poster
	let source

	let session = ""		// get this from local storage (cookie)

	$: poster = media.poster
	$: source = media.source
	$: tracking = media._tracking

	// These values are bound to properties of the video
	//let time = 0;
	//let duration;
	let paused = true;
	let audio;

	let links = {
		"source" : "",
		"poster" : ""
	}

	let poster_link
	let source_link
	$: {
		set_links(tracking)
	}
 
	async function set_links(tracking) {
		let counter_service = media._x_link_counter
		links = await media_startup(tracking,'ipfs',media,counter_service,session)
		if ( media_links.poster ) {
			poster_link = media_links.poster
		}
		if ( media_links.source ) {
			source_link = media_links.source_link
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
		<source src="{source_link}" type="audio/ogg">
		<source src="{source_link}" type="audio/mpeg">
		Your browser does not support the audio element.
	</audio>
</div>
