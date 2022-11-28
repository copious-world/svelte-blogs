<script context="module">
	let current;
</script>

<script>
	export let media
	export let tracking
	export let source_link

	let poster
	let source

	let session
	let poster_link

	$: session = window.retrieve_session()		// get this from local storage (cookie)

	$: poster = media.poster
	$: source = media.source
	$: _tracking = (tracking == undefined) ? media._tracking : tracking

	let source_link_update = ""
		// These values are bound to properties of the video
	//let time = 0;
	//let duration;
	let paused = true;
	let audio;

	$: if ( source_link === undefined || source_link.length === 0 ) {
		source_link = media._impl_source_link
		poster_link = media._impl_poster_link
	}

	$: {
		source_link_update = source_link
		if ( audio ) {
			audio.src = source_link_update
			//audio.load()
		}
	}


	let media_links = {
		"source" : "",
		"poster" : ""
	}


	$: if ( (_tracking !== undefined) && (tracking == undefined) ) {
		set_links(_tracking)
	}
 
	async function set_links(tracking) {
		let counter_service = media._x_link_counter
		media_links = await media_startup(tracking,'ipfs',media,counter_service,session)
		if ( media_links ) {
			if ( media_links.poster ) {
				poster_link = media_links.poster
			}
			if ( media_links.source ) {
				source_link = media_links.source_link
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
		<source src="{source_link_update}" type="audio/ogg">
		<source src="{source_link_update}" type="audio/mpeg">
		Your browser does not support the audio element.
	</audio>
</div>
