<script>
	//
	import {link_picker,picker} from "../../common/link-pick.js"
	import {tz_day_is_today,getTimezoneOffset} from '../../common/date_utils'
	//
	import {timestamp_db} from '../../common/timestamp_db'
	//
	import { onMount } from 'svelte';

	// `current` is updated whenever the prop value changes...
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
	export let time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;


	const ONE_HOUR = (3600*1000)
	const USE_AS_BLOCK = "block"
	const USE_AS_MEET = "meeting"
	const USE_AS_ACTIVITY = "activity"
	const USE_AS_OPEN = "open"

	let today = new Date()
	let date_string = today.toUTCString()
	let local_date_string =  today.toLocaleDateString("en-US", { timeZone: time_zone })
	let local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone })
	let local_dt_string = `${local_date_string} ${local_time_string}`


	$: date_string = today.toUTCString()
	$: local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone })
	$: local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone })
	$: local_dt_string = `${local_date_string} ${local_time_string}`

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


	function day_includes_events(a_day) {
		let st = a_day.start_time
		let et = a_day.end_time
		//
		let tzoff = getTimezoneOffset(time_zone,st)
		//console.log(tzoff)

		st -= ONE_HOUR*tzoff
		et -= ONE_HOUR*tzoff
		return timestamp_db.range_has_events(st,et,(evnt) => {  return evnt.use !== USE_AS_BLOCK })
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
	{#if show_clock }
		<span class="blg-item-title" >Today Is</span>
		<span style="color:navy;font-weight:bolder;font-size:66%">{local_dt_string} {time_zone}</span>
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
			<ol class="day-grid">
				{#each cal.table as a_week}
					{#each a_week as a_day_key}
						{#if a_day_key !== false }
							{#each [cal.map[a_day_key]] as a_day}
								{#if day_includes_events(a_day) }
								<li class="event-access-plus" style="{ tz_day_is_today(a_day,year,month,local_date_string,time_zone) ? 'border:solid 2px lime' : '' }" >{a_day.day}</li>
								{:else}
								<li class="event-access" style="{ tz_day_is_today(a_day,year,month,local_date_string,time_zone) ? 'border:solid 2px lime' : '' }" >{a_day.day}</li>
								{/if}
							{/each}
						{:else}
							<li class="exclude-day">-</li>
						{/if}
					{/each}
				{/each}
			</ol>	
		</div>
		<!-- class="month=prev"class="month-next">  -->
	</div>
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