
<script>
	// for the larger display ... occupies a slot in the Float Window...
	// When an element is selected, one kind of media play gets picked depending on the element media type.
import VideoPlayer from "./VideoPlayer.svelte";
import AudioPlayer from "./AudioPlayer.svelte";
import IPFS_VideoPlayer from "./IPFS_VideoPlayer.svelte"
import IPFS_AudioPlayer from "./IPFS_AudioPlayer.svelte"

//
export let color;
export let entry;
export let title;
export let dates;
export let keys;
export let media_type;
export let abstract;
export let media
export let isplaying



let fillFree = true;

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

let is_audio

$: is_audio = (media_type == 'audio')

let short_title
$: short_title = title.substr(0,45)

let descr_on = false;

let is_ipfs
$: is_ipfs = (media.protocol === 'ipfs')

function play_media(ev) {
	// turn on/off media player
}

function pause_media(ev) {

}

function stop_media(ev) {

}

function rewind_media(ev) {

}

</script>

<div class="container-head">
   <div style="display:inline-block">
    <span style="background-color: {color}">{entry}</span>
		<span style="background-color: yellowgreen">{created_when}</span>
		<span style="background-color: lightblue">{updated_when}</span>
		<span class="blg-item-title" style="background-color: inherit;">{short_title}</span>
   </div>
</div>
<div >
{#if is_audio }
	{#if is_ipfs }
		<div class="music_box" >
			<IPFS_AudioPlayer {...media} />
		</div>
	{:else}
		<div class="music_box" >
			<AudioPlayer {...media} />
		</div>
	{/if}
{:else} 
	{#if is_ipfs }
		<div class="video_box" >
			<IPFS_VideoPlayer {...media} {isplaying} />
		</div>
	{:else}
		<div class="video_box" >
			<VideoPlayer {...media} {isplaying} />
		</div>
	{/if}
{/if}
	<div class="description" >
		{@html abstract}
	</div>
</div>



<style>

	span {
		display: inline-block;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		text-align: center;
		border-radius: 0.2em;
		color: white;
	}

	.view-ctrl {
		font-size: 0.80em;
	}

	.view-ctrl button {
		max-height: 25px;
		height: fit-content;
		border-radius: 25px;
	}

	.blg-item-title {
		color:rgb(17, 19, 18);
		display: unset;
		border-bottom: 1px darkslateblue solid;
		font-weight: bold;
	}

	.description {
		display : inline-flex;
		border:rgb(64, 2, 90) solid 1px;
		padding: 4px;
		background-color: ghostwhite;
		color: rgb(63, 1, 1);
	}

	.music_box {
		display:inline-block;
		width: 20%;
		max-width: 80px
	}
	.video_box {
		display:block;
		width:100%;
	}

	.container-head {
		border-bottom: 2px solid lightsteelblue;
		background-color: rgb(244, 250, 252);
	}

</style>