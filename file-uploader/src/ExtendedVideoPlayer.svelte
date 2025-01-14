<script>

	import VideoPlayer from 'svelte-video-player';

	export let media
	export let session
	export let tracking

	export let isplaying = false


	let poster_link = ""
	let source_link = ""

	let source = ''
	let poster = ''
	let show_video = false


	$: if ( tracking !== false ) {
		(async () => {
				console.log(tracking)
				await set_links(tracking)
				source = source_link
				poster = poster_link
				show_video = !((source === undefined) || (source.length === 0))
		})()
	}

	async function set_links(tracking) {
		let counter_service = media._x_link_counter
		let media_links = await media_startup(tracking,media.protocol,media,counter_service,session)
		if ( media_links ) {
			if ( media_links.poster ) {
				poster_link = media_links.poster
			}
			if ( media_links.source ) {
				source_link = media_links.source
			}
		}
	}

</script>

<style>
	div {
		position: relative;
	}
</style>

<div>
	{#if !(show_video) }
		<span>no video</span>
	{:else}
		<VideoPlayer {source} {poster} calc_source={false} paused={!(isplaying)} />
	{/if}
</div>
