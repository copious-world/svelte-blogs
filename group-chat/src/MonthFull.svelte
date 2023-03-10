<script>
	import { createEventDispatcher } from 'svelte';
	import {tz_day_is_today,getTimezoneOffset,day_is_before_today} from '../../common/date_utils'
	//
	import {timestamp_db} from '../../common/timestamp_db'

	const dispatch = createEventDispatcher();

	// `current` is updated whenever the prop value changes...
	export let dates;
	export let entry;
	export let title;
	export let ucwid;
	export let comment;
	export let month;
	export let month_str;
	export let year;
	export let cal			// the calendar object 
	export let total_events
	export let time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;


	const ONE_HOUR = (3600*1000)
	const ONE_HALF_HOUR = (3600*500)
	const ONE_QUARTER_HOUR = (3600*250)
	const ONE_QUARTER_HOUR_MINUTES = (15)
	const ONE_HALF_HOUR_MINUTES  = (30)

	const USE_AS_BLOCK = "block"
	const USE_AS_MEET = "meeting"
	const USE_AS_ACTIVITY = "activity"
	const USE_AS_OPEN = "open"

	// ---- ---- ---- ---- ---- ---- ---- ---- ----

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
	let date_string = today.toUTCString()
	let local_date_string =  today.toLocaleDateString("en-US", { timeZone: time_zone })
	let local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone })
	let local_dt_string = `${local_date_string} ${local_time_string}`


	$: date_string = today.toUTCString()
	$: local_date_string = today.toLocaleDateString("en-US", { timeZone: time_zone })
	$: local_time_string = today.toLocaleTimeString("en-US", { timeZone: time_zone })
	$: local_dt_string = `${local_date_string} ${local_time_string}`


	let calc_day = new Date()
	let current_month = calc_day.getMonth()
	let current_day = calc_day.getDate()
	let current_year = calc_day.getFullYear()

	$: {
		calc_day = new Date(year,month)
		current_month = month
		current_day = calc_day.getDate()
		current_year = calc_day.getFullYear()
	}

	//let updated_when
	//let created_when
	//$: updated_when = convert_date(dates.updated)
	//$: created_when = convert_date(when)



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


	let going_session = false

	function event_management(event,day_key) {
		//
		let tid = event.currentTarget.innerHTML
		let day_info = cal.map[day_key]
		//
		if ( day_is_before_today(day_info.day,year,month) ) {
			alert("This day has gone by")
			return
		}
		//
		day_info = Object.assign({},day_info,{
			"month" : current_month,
			"year" : current_year,
			"monthstr" : month_str
		})
		//
		//console.log(day_info)
		//
		dispatch('message', {
			"type": 'event-click',
			"text": ('click ' + tid),
			"day_info" : day_info
		})
		//
	}


</script>

<div class="blg-el-wrapper-full">
	<div style="padding:6px;" >
		<div class="calendar">
			<header>
			  <h1>{month_str} {year}</h1>
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
					{#each cal.table as a_week}
						{#each a_week as a_day_key}
							{#if a_day_key !== false }
								{#each [cal.map[a_day_key]] as a_day}
									{#if day_includes_events(a_day) }
									<li class="event-access-plus" style="{ tz_day_is_today(a_day,year,month,local_date_string,time_zone) ? 'border:solid 2px lime' : '' }" on:click={(ev) => {event_management(ev,a_day_key)}}>{a_day.day}</li>
									{:else}
									<li class="event-access" style="{ tz_day_is_today(a_day,year,month,local_date_string,time_zone) ? 'border:solid 2px lime' : '' }" on:click={(ev) => {event_management(ev,a_day_key)}}>{a_day.day}</li>
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
			<div class = "ev-count">
				Number of events taking_place: {total_events}
			</div>
		  </div>
	</div>
</div>

<style>

	.blg-el-wrapper-full {
		overflow-y: scroll;
		height: 90%;
	}

	.scroller-grid {
		height: calc(90%);
		overflow-y: scroll;
		padding: 0.9em;
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


	.ev-count {
		margin-top: 6px;
		padding:4px;
		color: rgb(70, 112, 70);
	}

	ul, ol {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-gap: 0.8em;
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
		height: 110%;
		max-height: 120px;
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
			grid-gap: .20em;
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