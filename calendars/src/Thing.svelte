<script>

	import {link_picker,picker} from "../../common/link-pick.js"
	import { onMount } from 'svelte';

	// `current` is updated whenever the prop value changes...
	export let dates;
	export let entry;
	export let score;
	export let ucwid;
	export let when;
	export let comment;


	let today = new Date()
	let date_string = today.toUTCString()

	$: date_string = today.toUTCString()

	onMount(() => {
		const interval = setInterval(() => {
			today = new Date()
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	let truncated 
	$: truncated = (comment !== undefined) ? comment.substr(0,250) + "&#8230;" : "search"

	let score_rounded
	$: score_rounded = score ? score.toFixed(3) : 0;

	let picked_this = false
	$: picked_this = link_picker.is_picked(entry)


	function convert_date(secsdate) {
		if ( secsdate === 'never' ) {
			return 'never';
		} else {
			let idate = parseInt(secsdate)
			let dformatted = (new Date(idate)).toLocaleString('en-US')
			return (dformatted)
		}
	}

	let updated_when
	let created_when

	$: updated_when = dates ? convert_date(dates.updated) : ""
	$: created_when = dates ? convert_date(when) : ""

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

{#if dates && (dates.created != 'never') }
<div class="blg-el-wrapper" >
	
	<input type="checkbox" bind:checked={picked_this} on:click={toggle_pick} />
	<span class="thng-score">{score_rounded}</span>
	<span style="color: darkbrown">{ucwid}</span>
	<span style="background-color: yellowgreen">{created_when}</span>
	<h6>{ucwid}</h6>
	<div class="teaser">
		{@html truncated}
	</div>	
</div>

{:else}
<div class="blg-el-wrapper">
	<h4 class="blg-item-title" style="background-color: lightgrey;color:darkgrey">Today Is</h4>
	<span style="color:navy;font-weight:bolder">{date_string}</span>
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

	.blg-item-title {
		color:black;
		display: unset;
		border-bottom: 1px darkslateblue solid;
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
		max-height: 60px;
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
			max-height: 40px;
		}
	}

	@media (max-width: 1000px) {
		.teaser {
			max-height: 30px;
		}
	}

	@media (max-width: 900px) {
		.teaser {
			max-height: 24px;
		}
	}

	@media (max-width: 700px) {
		.teaser {
			max-height: 20px;
		}
	}

	@media (max-width: 600px) { 
		.teaser {
			max-height: 40px;
		}
	}
</style>