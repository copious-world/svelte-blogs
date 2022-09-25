<script>
	//
	import {link_picker,picker} from "../../common/link-pick.js"
	//
	import { onMount } from 'svelte';

	// `current` is updated whenever the prop value changes...
	export let id;
	export let dates;
	export let entry;
	export let score;
	export let ucwid;
	export let when;
	export let comment;

	export let month;
	export let month_str;
	export let year;
	export let cal			// the calendar object 


	let today = new Date()
	let date_string = today.toUTCString()

	$: date_string = today.toUTCString()

	let months_away = (year === today.getFullYear()) ? (month - today.getMonth()) : -1
	if ( (months_away < 0) && (year > today.getFullYear()) ) {
		let y_diff = (year - today.getFullYear())
		months_away = (12 - today.getMonth() - 1) + 12*(y_diff-1) + month + 1
	}

	let show_clock = false
	$: if ( ( today.getMonth() === month) && (today.getFullYear() === year ) ) {
		show_clock = true
	} else {
		show_clock = false	
	}

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

	$: if ( id !== undefined ) {
		//
		setTimeout(() => {
			let thing_box = document.getElementById(`xy_${id}`)
			if ( thing_box ) {
				thing_box.style.height = "90px";
			}
		},5)
		//
	}

</script>


<div class="blg-el-wrapper">
	{#if show_clock }
		<span class="blg-item-title" >Today Is</span>
		<span style="color:navy;font-weight:bolder;font-size:70%">{date_string}</span>
	{:else}
		<span class="blg-item-title" >{month_str} is </span>
		<span style="color:navy;font-weight:bolder">{months_away}</span>
		{#if months_away === 1 }
			<span class="blg-item-title" > month away</span>
		{:else}
			<span class="blg-item-title" > months away</span>
		{/if}
	{/if}
	<div>
		<h6>{month_str} {year}</h6>
		<div>
		</div>
	</div>
</div>

<style>

	.blg-el-wrapper {
		overflow-y: hidden;
		height:100px;
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
		background-color: rgb(250, 255, 250);
		border: 1px black solid;
		border-radius: 0.2em;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		font-size: larger;
		color:black;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 98%;
	}



	ol {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-gap: 0.16em;
		margin: 0 auto;
		max-width: 0.46em;
	}

	li {
		display: flex;
		align-items: left;
		justify-content: center;
		list-style: none;
		margin-left: 0;
		font-size: 11px;
	}


	ol.day-grid li {
		background-color: #f9fdf5;
		height: 14px;
		max-height: 20px;
		border-right : solid 1px green;
		border-bottom : solid 1px purple;
	}


	ol.day-grid li.event-access-plus {
		color: orangered;
		background-color: rgb(251, 248, 232);
	}


	@media all and (max-width: 800px) {
		ol {
			grid-gap: .05em;
		}
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