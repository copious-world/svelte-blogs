<script>
	import { createEventDispatcher } from 'svelte';
	import {EventDays} from 'event-days'

	const dispatch = createEventDispatcher();

	// ref ... https://gist.github.com/akirattii/9165836

	// `current` is updated whenever the prop value changes...
	export let dates;
	export let entry;
	export let title;
	export let ucwid;
	export let when;
	export let comment;
	export let month;
	export let year;
	export let cal			// the calendar object 

	let MonthFull = EventDays.MonthFull

	function convert_date(secsdate) {
		if ( secsdate === 'never' ) {
			return 'never';
		} else {
			let idate = parseInt(secsdate)
			let dformatted = (new Date(idate)).toLocaleDateString('en-US')
			return (dformatted)
		}
	}

	let today = new Date()
	let test_current_mo = today.getMonth()
	let current_day = today.getDate()
	let current_year = today.getFullYear()

	let current_month = 0
	$: current_month = test_current_mo

	let test_cal = []
	test_cal.push([{ "month" : 7, "day" : 29},
		{ "month" : 7, "day" : 30, "year" : year},
		{ "month" : 7, "day" : 31, "year" : year},
		{ "month" : 8, "day" : 1, "year" : year},
		{"month" : 8, "day" : 2, "year" : year},
		{"month" : 8, "day" : 3, "year" : year},
		{"month" : 8, "day" : 4, "year" : year}])
	let nw = []
	for ( let d = 5; d < 12; d++ ) {
		nw.push({"month" : 8, "day" : d, "year" : year })
	}
	test_cal.push(nw)
	nw = []
	for ( let d = 12; d < 19; d++ ) {
		nw.push({"month" : 8, "day" : d, "year" : year })
	}
	test_cal.push(nw)
	nw = []
	for ( let d = 19; d < 26; d++ ) {
		nw.push({"month" : 8, "day" : d, "year" : year })
	}
	test_cal.push(nw)
	test_cal.push([
		{"month" : 8, "day" : 26, "has_events" : true, "year" : year },
		{"month" : 8, "day" : 27, "year" : year},
		{"month" : 8, "day" : 28, "year" : year},
		{"month" : 8, "day" : 29, "year" : year},
		{"month" : 8, "day" : 30, "year" : year},
		{ "month" : 9, "day" : 1, "year" : year},
		{ "month" : 9, "day" : 2, "year" : year}
	])


	let updated_when
	let created_when

	$: updated_when = convert_date(dates.updated)
	$: created_when = convert_date(when)

	let going_session = false


	function event_management(event) {
		//
		let tid = event.currentTarget.innerHTML
		dispatch('message', {
			"type": 'event-click',
			"text": ('click ' + tid),
			"day_info" : {
				"day" : tid,
				"month" : current_month,
				"year" : current_year,
				"ev_list" : {
					"10:00" : "nothing",
					"12:00" : "lunch",
					"18:00" : "dinner"
				}
			}
		});
		//
	}


</script>
 
<div class="blg-el-wrapper-full">
	<div style="padding:6px;" >
		<div class="calendar">
			<header>
			  <h1>{month} {year}</h1>
			</header>
		  
			<ul class="weekdays">
			  <li>
				<abbr title="S">S</abbr>
			  </li>
			  <li>
				<abbr title="M">M</abbr>
			  </li>
			  <li>
				<abbr title="T">T</abbr>
			  </li>
			  <li>
				<abbr title="W">W</abbr>
			  </li>
			  <li>
				<abbr title="T">T</abbr>
			  </li>
			  <li>
				<abbr title="F">F</abbr>
			  </li>
			  <li>
				<abbr title="S">S</abbr>
			  </li>
			</ul>
			<div class="scroller-grid">
				<ol class="day-grid">
					{#each test_cal as a_week}
						{#each a_week as a_day}
							{#if a_day.month === test_current_mo }
								{#if a_day.has_events }
								<li class="event-access-plus" style="{current_day == a_day.day ? 'border:solid 2px lime' : '' }" on:click={event_management}>{a_day.day}</li>
								{:else}
								<li class="event-access" style="{current_day == a_day.day ? 'border:solid 2px lime' : '' }" on:click={event_management}>{a_day.day}</li>
								{/if}
							{:else}
								<li class="exclude-day">{a_day.day}</li>
							{/if}
						{/each}
					{/each}
				</ol>	
			</div>
			<!-- class="month=prev"class="month-next">  -->
		  </div>
	</div>
</div>

<style>

	.blg-el-wrapper-full {
		overflow-y: hidden;
		height:auto;
	}

	.scroller-grid {
		max-height: 100%;
		overflow-y: scroll;
	}


	header {
		display: flex;
		align-items: center;
		font-size: calc(16px + (26 - 16) * ((100vw - 300px) / (1600 - 300)));
		justify-content: center;
		margin-bottom: 2em;
		background: #000;
		color: #fff;
		min-height: 10vh;
		text-align: center;
	}

	ul, ol {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-gap: 1em;
		margin: 0 auto;
		max-width: 64em;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: center;
		list-style: none;
		margin-left: 0;
		font-size: calc(16px + (21 - 16) * ((100vw - 300px) / (1600 - 300)));
	}


	ul.weekdays {
		margin-bottom: 1em;
	}

	ul.weekdays li {
		height: 4vw;
		width: 90%;
		overflow : hidden;
		text-align: left;
	}

	ol.day-grid li {
		background-color: #fafef7;
		border: 1px solid #4a0fc9;
		height: 120%;
		max-height: 125px;
		border-right : solid 1px green;
	}


	ol.day-grid li.exclude-day {
		background-color: white;
	}

	ol.day-grid li.event-access {
		 cursor: pointer;
	}

	ol.day-grid li.event-access-plus {
		cursor: pointer;
		color: orangered;
		background-color: rgb(251, 248, 232);
	}

	ul.weekdays abbr[title] {
		border: none;
		font-weight: 800;
		text-decoration: none;
		text-align: left;
	}

	ul.weekdays li abbr {
		text-align: left;
		font-size: calc(12px + (6) * ((100vw - 300px) / (1600 - 300)));
	}


	@media all and (max-width: 800px) {
		ul, ol {
			grid-gap: .25em;
		}

		ul.weekdays li {
			font-size: 0;
		}

		ul.weekdays > li abbr:after {
			content: attr(title);
			font-size: calc(16px + (26 - 16) * ((100vw - 300px) / (1600 - 300)));
			text-align: center;
		}
	}
</style>