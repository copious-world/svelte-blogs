<script>
	import AudioPlayer from "./AudioPlayer.svelte";
	import {link_picker,picker} from "../../common/link-pick.js"
	//
	// `current` is updated whenever the prop value changes...
	export let color;
	export let entry;
	export let title;
	export let dates;
	export let keys;
	export let media_type;
	export let abstract;
	export let media
	export let score;
	export let id;
	export let _tracking
	// // 
	let score_rounded

	let session;

	$: session = window.retrieve_session()

	$: score_rounded = score.toFixed(3);

	let is_audio

	$: is_audio = (media_type == 'audio')

	// ---- ---- ---- ---- ---- ---- ---- ----
	$: tracking = _tracking

	let poster_link = ""
	let source_link = ""

	$: if ( tracking !== false ) {
		set_links(tracking)
	}

	async function set_links(tracking) {
		let counter_service = media._x_link_counter
		let media_links = await media_startup(tracking,media.protocol,media,counter_service,session)
		if ( media_links ) {
			if ( media_links.poster ) {
				poster_link = media_links.poster
				media._impl_poster_link = poster_link
			}
			if ( media_links.source ) {
				source_link = media_links.source
				media._impl_source_link = source_link
			}

		}
	}

	let picked_this = false
	$: picked_this = link_picker.is_picked(entry)

	// //
	function convert_date(secsdate) {
		if ( secsdate === 'never' ) {
			return 'never';
		} else {
			let idate = parseInt(secsdate)
			let dformatted = (new Date(idate)).toLocaleDateString('en-US')
			return (dformatted)
		}
	}

	let updated_when
	let created_when

	$: updated_when = convert_date(dates.updated)
	$: created_when = convert_date(dates.created)

	let short_title
	$: short_title = title.substr(0,16) + '...'


	function toggle_pick(ev) {
		ev.stopPropagation ()
		link_picker.toggle_pick(entry)
		if ( picked_this ) {
			picker.increment()
		} else {
			picker.decrement()
		}
	}

	let count_value;
	const unsubscribe = picker.subscribe(value => {
		count_value = value;
		picked_this = link_picker.is_picked(entry)
	});


</script>

{#if dates.created != 'never' }
<div class="blg-el-wrapper" >
	<input type="checkbox" bind:checked={picked_this} on:click={toggle_pick} />
	<span style="background-color: {color}">{entry}</span>
	<span style="background-color: yellowgreen">{created_when}</span>
	<span style="background-color: lightblue">{updated_when}</span>
	<h4 class="blg-item-title" style="background-color: inherit;">{short_title}</h4>
	<span class="thng-score">{score_rounded}</span>
	<div class="teaser">
		{#if is_audio }
			<AudioPlayer {media} {tracking} {source_link} />
		{:else}
			<img src="{poster_link}" height="120px" alt="{title}" >
		{/if}
	</div>	
</div>

{:else}
<div class="blg-el-wrapper">
	<h4 class="blg-item-title" style="background-color: lightgrey;color:darkgrey">End of Content</h4>
</div>
{/if}
<style>

	.blg-el-wrapper {
		overflow-y: hidden;
		height:inherit;
	}

	span {
		display: inline-block;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		text-align: center;
		border-radius: 0.2em;
		color: white;
	}

	.little-component {
		display: inline-block;
		vertical-align: top;
		max-height: inherit;
	}

	.blg-item-title {
		color:black;
		display: unset;
		border-bottom: 1px darkslateblue solid;
	}

	.blg-item-subject {
		color:black;
		display: unset;
	}

	.thng-score {
		background-color: rgb(247, 247, 225);
		color: rgb(4, 4, 104);
		font-size: 0.60em;
		font-weight: bold;
		border: solid 1px rgb(233, 233, 164);
	}

	.teaser {
		margin-top: 3px;
		border-top: 1px solid black;
		font-size: 70%;
		color:rgba(129, 129, 129);
		background-color:rgb(250, 248, 248);
		max-height: 160px;
		overflow-y: hidden;
		text-overflow: ellipsis;
	}


	h6 {
		background-color: rgb(245, 245, 245);
		border: 1px black solid;
		border-radius: 0.2em;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		color:black;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 200px;
	}

	@media (max-width: 1200px) {
		.teaser {
			max-height: 140px;
		}
	}

	@media (max-width: 1000px) {
		.teaser {
			max-height: 130px;
		}
	}

	@media (max-width: 900px) {
		.teaser {
			max-height: 124px;
		}
	}

	@media (max-width: 700px) {
		.teaser {
			max-height: 120px;
		}
	}

	@media (max-width: 600px) { 
		.teaser {
			max-height: 140px;
		}
	}
</style>