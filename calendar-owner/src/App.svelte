<script>
	export let name;

	import FullMonth from './MonthFull.svelte';
	import Thing from './Thing.svelte'
	import DayEvents from './DayEvents.svelte'
	//
	import ThingGrid from 'grid-of-things';
	import FloatWindow from 'svelte-float-window';

	import { process_search_results, place_data, merge_data, clonify, make_empty_thing, link_server_fetch } from '../../common/data-utils.js'
	import { popup_size } from '../../common/display-utils.js'
	import { get_search } from "../../common/search_box.js"

	import { EventDays } from 'event-days'
	import panzoom from 'panzoom';



	import { onMount } from 'svelte';



	let panzoomOptions = {
		maxZoom: 5,
		minZoom: 1,
		initialZoom: 1,
		zoomDoubleClickSpeed: 1,
		transformOrigin: {x: 0, y: 0},
		zoomSpeed: 0.25,
		preserveAspecRatio: false,
		scaleFactors: { x : 1.0, y : 0.0 }
		// beforeMouseDown: (e) => {
		//   return !e.altKey;
		// },
	};

	let x = 1000;
  	let y = 1000;

	let canvasElt = null;
	let panzoomInstance = null;



	let session = ""
	let going_session = ""

	let day_event_count = 0

	//
	const ONE_HOUR = (3600*1000)
	const ONE_HALF_HOUR = (3600*500)
	const ONE_QUARTER_HOUR = (3600*250)
	const ONE_QUARTER_HOUR_MINUTES = (15)
	const ONE_HALF_HOUR_MINUTES  = (30)
	//
	const USE_AS_BLOCK = "block"
	const USE_AS_MEET = "meeting"
	const USE_AS_ACTIVITY = "activity"
	const USE_AS_OPEN = "open"
	//

	const MonthContainer = EventDays.MonthContainer
	const Slot = EventDays.Slot
	const TimeSlotAgenda = EventDays.TimeSlotAgenda


	let line_points = []
	let info_points = []
	let divider_starts = -36;
	let division_width = 200
	let point = { x : divider_starts, y : 0 }
	let left_shift = divider_starts*division_width

	let info_delta = 3

	for ( let i = 0; i < 1000; i++ ) {
		line_points.push({ x : (i*division_width + left_shift), y : 0, index : (divider_starts + i)})
		info_points.push({ x : (i*division_width + left_shift), y : 0, index : (divider_starts + i)})
	}

	let original_info_points = info_points.map(p => {
		return Object.assign({},p)
	})


	class ReqSlot extends Slot {
		//
		constructor(label,begin_at,end_at,info,d_date) {
			super(label,begin_at,end_at)
			this.index = info.index
			this.label = ""
			this.person_id =  ""
			this.email =  ""
			this.contact_phone = ""
			this.on_zoom = false
			this.in_person = false
			this.time = d_date.toLocaleTimeString()
			this.use = info.blocked
			this.on_hour = USE_AS_OPEN
			this.on_half_hour = info.on_half_hour
			this.changed =  false
			this.how_long =  15
		}
		//
	}

	// ---- ---- ---- ManageableTSAgenda
	class ManageableTSAgenda extends TimeSlotAgenda {
		//
		constructor(day,index) {
			super(day,index)
			this.all_day_list = []
			this.event_count = 0
			this.has_events = false
			this.key = ""
		}
		//

		fill_day(year,month,key) {
			let d_date = new Date(year,month,this.day);  // these have been passed
			let all_day_list = this.all_day_list
			//
			//
			for ( let i = 0; i < 48; i++ ) {
				//
				let hour = d_date.getHours()
				let minutes = d_date.getMinutes()
				let blocked = (hour < 10) || (hour >= 19) ? USE_AS_BLOCK : USE_AS_OPEN
				//
				let time = d_date.getTime()
				all_day_list[i] = new ReqSlot("",time,0,{
														"index" : i,
														"blocked" : blocked,
														"on_half_hour" : (minutes !== 0)
													},d_date)
				time += ONE_HALF_HOUR
				d_date = new Date(time)
			}
			// --  -- 
			this.all_day_list = all_day_list
			this.event_count = 0
			this.has_events = false
			this.key = key

		}
	}

	//
	let current_date = new Date()
	let g_mo_gen = new MonthContainer(current_date.getTime(),ManageableTSAgenda)


	let day_data = {
		"day" : current_date.getDate(),
		"month" : current_date.getMonth(),
		"year" : 2022,
		"all_day" : []
	}

	let current_day_data = day_data
	$: current_day_data = day_data

	let prev_day_event_count = day_event_count
	$: if ( prev_day_event_count != day_event_count ) {
		prev_day_event_count = day_event_count
		current_day_data.event_count = day_event_count
		current_day_data.has_events = (current_day_data.event_count > 0)
		current_thing.total_events = current_thing.total_events + 1
		let agenda = current_thing.cal.map[current_day_data.key]
		agenda.has_events = current_day_data.has_events
		agenda.event_count = current_day_data.event_count
		things = things
	}


	let data_stem = "contactsearch"

	
	let qlist_ordering = [
		{ id: 1, text: `update_date` },
		{ id: 2, text: `score` },
		{ id: 3, text: `create_date` }
	];


	let search_ordering = qlist_ordering[2];
	let search_topic = 'any'

	//
	let current_roller_title = ""

	let title_months = [
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" 
	]
	
	let model_month_entry = {
		"_tracking" : false,
		"color": 'grey',
		"title" : "no content",
		"month" : g_mo_gen.month,
		"year" : g_mo_gen.year,
		"start_time" : g_mo_gen.start_time,
		"end_time" : g_mo_gen.end_time,
		"cal"  : g_mo_gen.cal,
		"month_str" : title_months[g_mo_gen.month],
		"dates" : {
			"created" : "never",
			"updated" : "never"
		},
		"subject" : "",
		"abstract" : "no content",
		"keys" : [  ],
		"comments" : [],
		"score" : 1.0,
		"total_events" : 0
	}

	let thing_template = make_empty_thing(model_month_entry)

	function fill_cal(mentry) {
		//
		let cmap = mentry.cal.map
		for ( let ky in cmap ) {
			// 
		}
	}


	function merge_calendars(c_dst,c_src) {
		//
		if ( !c_dst ) return c_src
		if ( !c_src ) return c_dst
		//
		if ( (c_src.year === c_dst.year) && (c_src.month === c_dst.month) ) {
			//
			for ( let ky in c_dst.cal.map ) {
				let agenda_dst = c_dst.cal.map[ky]
				let agenda_src = c_dst.cal.map[ky]

				if ( agenda_src && agenda_dst ) {
					let n = agenda_src.all_day_list.length
					for ( let i = 0; i < n; i++ ) {
						let dst_d = agenda_dst.all_day_list[i]
						let src_d = agenda_src.all_day_list[i]
						if ( src_d.use !== USE_AS_OPEN ) {
							agenda_dst.all_day_list[i] = agenda_src.all_day_list[i]
						}
					}
				}
			}
			//
		}
		//
		if ( (c_src.year > c_dst.year) ) {  // condition arising out of showing a calendar without search (place holder value is current date)
			return c_src
		}
		return c_dst
	}
	

	let current_thing = Object.assign({ "id" : 0, "entry" : 0 },thing_template)
	let app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template)

	//fill_cal(current_thing)
	//fill_cal(app_empty_object)
	//
	//
	
	let window_scale = { "w" : 0.4, "h" : 0.6 }
	//
	let all_window_scales = []
	all_window_scales = popup_size()


	//
	onMount(() => {
		session = window.retrieve_session()
		window.addEventListener("resize", (e) => {
			//
			let scale = popup_size()
			//
			window_scale.h = scale.h; 
			window_scale.w = scale.w;
			//
		})

		//console.log(panzoom)
		
		// panzoom

		panzoomInstance = panzoom(canvasElt,panzoomOptions);
		// panzoomInstance.moveTo(centerX, centerY);


		panzoomInstance.on('zoom', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			info_points = repoint
		});

		panzoomInstance.on('zoomend', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			info_points = repoint
		});


		panzoomInstance.on('pan', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			info_points = repoint

		});


	})



	function handleMessage(event) {
		let key = "xy_"
		let txt = event.detail.text;
		let idx = txt.substr(txt.indexOf(key) + 3);

		let etype = event.detail.type
		idx = parseInt(idx);
		idx--;
		if ( (idx !== undefined) && (idx >= 0) && (idx < things.length)) {
			let athing = things[idx];
			if ( athing !== undefined ) {
				if ( etype === 'click' ) {
					current_thing = athing;
					let dd = new Date(athing.when)
					current_thing.title = dd.toLocaleDateString()
					start_floating_window(0);
				} else {
					current_roller_title = athing.title
				}
			}
		}
	}


	function handleEventPlanningMessage(event) {
		let data = event.detail
		day_data = data.day_info
		day_event_count = day_data.event_count
		start_floating_window(1,1.0,0.5);
		fix_z_topper(1);
	}

	function clickEmptyElement(thing_counter) {
		//
		let y = g_mo_gen.year
		let m = g_mo_gen.month
		m = (m + thing_counter - 1) % 12
		if ( m === 0 ) y++
		let ee_date = new Date(y,m)
		//
		let ee_thing = Object.assign({ "id" : 0, "entry" : 0 },thing_template)
		let mo_gen = new MonthContainer(ee_date.getTime(),ManageableTSAgenda)
		//
		ee_thing.month = mo_gen.month
		ee_thing.year = mo_gen.year
		ee_thing.start_time = mo_gen.start_time
		ee_thing.end_time = mo_gen.end_time
		ee_thing.cal = mo_gen.cal
		ee_thing.month_str = title_months[mo_gen.month]
		fill_cal(ee_thing)
		//
		//
		ee_thing.id = thing_counter
		return ee_thing
	}
	

	
	let things = [				// window
		app_empty_object
	];

	let other_things = [];		// current data...		loaded from server 

	let article_count = 1
	let article_index = 1

	let box_delta = 1;		// how boxes to add when increasing the window

	function needs_data(start,end) {
		if ( other_things.length > 0 ) {
			for ( let i = start; i < end; i++ ) {
				if ( other_things[i] === false ) {
					return true
				}
			}
		}
		return(false)
	}

	function do_data_placement() {
		let end = (article_index + things.length)
		let start = article_index - 1
		if ( needs_data(start,end) ) {
			data_fetcher(start,things.length)
		} else {
			place_data(things,other_things,article_index)
		}
	}


	function handleClick_remove() {
		for ( let i = 0; i < box_delta; i++ ) {
			let p = things
			p.pop()
			things = [...p];
		}
	}
	
	// ---- ---- ---- ---- ---- ---- ----
	async function handleClick_add() {
		let start = things.length
		for ( let i = 0; i < box_delta; i++ ) {
			let thing_counter = things.length
			thing_counter++
			let additional = clickEmptyElement(thing_counter)
			things = [...things, additional];
		}
		//
		let end = things.length   /// start + box_delta
		if ( needs_data(start,end) ) {
			data_fetcher(start,things.length)
		} else {
			pre_data_fetcher()
		}
	}


	//
	function handle_index_changed() {
		do_data_placement()
		
	}
	function handleClick_first() {
		article_index = 1
		do_data_placement()
	}

	function handleClick_last() {
		article_index = article_count
		do_data_placement()
	}

	function handle_keyDown(ev) {
		if(ev.charCode == 13){
			article_index = 1
			data_fetcher()
		}
	}

	function handle_order_change(ev) {
		article_index = 1
		data_fetcher()
	}


	function handleClick_fetch(ev) {
		article_index = 1
		data_fetcher()
	}

	function unload_data(data) {
		let usable_data = data.map(datum => {
			let the_comment = decodeURIComponent(datum.comment) 
			datum.comment = the_comment
			datum.title = datum.comment.substring(0,16)
			if ( datum.when === undefined ) {
				datum.when = datum.dates.created
			}
			return datum
		})
		return usable_data
	}


	function pre_data_fetcher(qstart,alt_length) {
		let l = (alt_length === undefined) ? things.length : alt_length
		let stindex = (qstart === undefined) ? (article_index - 1): qstart
		//
		stindex = Math.max(0,stindex)
		try {

			let search_result = {
				"data" : [],
				"count" : l
			}

			let ee_date = new Date()
			for ( let ee = 0; ee < l; ee++ ) {
				let ee_thing = Object.assign({ "id" : 0, "entry" : 0 },thing_template)
				let mo_gen = new MonthContainer(ee_date.getTime(),ManageableTSAgenda)
				//
				ee_thing.month = mo_gen.month
				ee_thing.year = mo_gen.year
				ee_thing.start_time = mo_gen.start_time
				ee_thing.end_time = mo_gen.end_time
				ee_thing.cal = mo_gen.cal
				ee_thing.month_str = title_months[mo_gen.month]

				fill_cal(ee_thing)
				search_result.data.push(ee_thing)
				//
				let y = mo_gen.year
				let m = mo_gen.month
				m = (m + 1) % 12
				if ( m === 0 ) y++
				ee_date = new Date(y,m)
			}

			let [a_i,lo,ot] = process_search_results(stindex,qstart,search_result,other_things,unload_data)
			article_index = a_i
			article_count = lo
			other_things = ot

			if ( other_things !== false ) {
				things = merge_data(merge_calendars,things,other_things,article_index)
			}

		} catch (e) {
			alert(e.message)
		}
	}

	async function data_fetcher(qstart,alt_length) {
		let l = (alt_length === undefined) ? things.length : alt_length
		let stindex = (qstart === undefined) ? (article_index - 1): qstart
		let qry = encodeURIComponent(search_topic)

		qry += '|' + search_ordering.text
		//
		//console.log(search_ordering.text)
		//
		let uid = get_search(qry,true)
		//
		stindex = Math.max(0,stindex)
		let post_params = {
			"uid" : uid,
			"query" : qry,
			"box_count" : l,
			"offset" : stindex
		};
		try {
			let rest = `${post_params.uid}/${post_params.query}/${post_params.box_count}/${post_params.offset}`
			let srver = location.host
			let prot = location.protocol
			let sp = '//'
			//data_stem = ""  // TEST  /${data_stem}
			//let search_result = await link_server_fetch(`${prot}${sp}${srver}/${data_stem}/${rest}`,post_params, postData)

			let search_result = {
				"data" : [],
				"count" : l
			}

			let ee_date = new Date()
			for ( let ee = 0; ee < l; ee++ ) {
				let ee_thing = Object.assign({ "id" : 0, "entry" : 0 },thing_template)
				let mo_gen = new MonthContainer(ee_date.getTime(),ManageableTSAgenda)
				//
				ee_thing.month = mo_gen.month
				ee_thing.year = mo_gen.year
				ee_thing.start_time = mo_gen.start_time
				ee_thing.end_time = mo_gen.end_time
				ee_thing.cal = mo_gen.cal
				ee_thing.month_str = title_months[mo_gen.month]

				fill_cal(ee_thing)
				search_result.data.push(ee_thing)
				//
				let y = mo_gen.year
				let m = mo_gen.month
				m = (m + 1) % 12
				if ( m === 0 ) y++
				ee_date = new Date(y,m)
			}


			let [a_i,lo,ot] = process_search_results(stindex,qstart,search_result,other_things,unload_data)
			article_index = a_i
			article_count = lo
			other_things = ot

			if ( other_things !== false ) {
				things = merge_data(merge_calendars,things,other_things,article_index)
			}

		} catch (e) {
			alert(e.message)
		}
	}


</script>
<!-- 
<text  x="50" y="59"  fill="navy"   stroke="nne" stroke-width="1" vector-effect="non-scaling-size" >This is a test</text>

<path
	stroke="black"
	d="M 50 50 l 0.0001 0"
	vector-effect="non-scaling-stroke"
	stroke-linecap="round"
	stroke-width="100"
/>
<path
	stroke="white"
	d="M 50 50 l 0.0001 0"
	vector-effect="non-scaling-stroke"
	stroke-linecap="round"
	stroke-width="98"
/>

<path
	d="M 100 50 l 0.0001 0"
	vector-effect="non-scaling-stroke"
	stroke-width="100"
	stroke-linecap="square"
	stroke="black"
/>
<path
	d="M 100 50 l 0.0001 0"
	vector-effect="non-scaling-stroke"
	stroke-width="98"
	stroke-linecap="square"
	stroke="white"
/>

<path d="M25 15 L 25 35" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>


-->
<div>
	<div class="calendar-admin-slider" >
		<svg style="width:100%">
			<!-- this is the draggable root -->
			<g>
				<path fill="red" stroke="black" vector-effect="non-scaling-stroke" d="M5.27 59.70L5.27 9.28L10.62 9.28L10.62 29.36Q15.86 24.12 21.02 24.12L21.02 24.12Q26.89 24.12 29.60 29.29L29.60 29.29Q31.11 32.20 31.11 36.35L31.11 36.35L31.11 59.70L25.77 59.70L25.77 37.93Q25.77 29.21 20.18 29.21L20.18 29.21Q16.42 29.21 13.57 31.96L13.57 31.96Q10.62 34.91 10.62 38.71L10.62 38.71L10.62 59.70L5.27 59.70ZM62.05 49.08L67.68 49.08Q64.55 61.10 54.07 61.10L54.07 61.10Q47.57 61.10 43.77 55.69L43.77 55.69Q40.32 50.73 40.32 42.61L40.32 42.61Q40.32 34.84 43.56 29.88L43.56 29.88Q47.36 24.12 54 24.12L54 24.12Q66.97 24.12 67.82 43.70L67.82 43.70L45.74 43.70Q46.16 56.29 54.14 56.29L54.14 56.29Q60.47 56.29 62.05 49.08L62.05 49.08ZM45.95 39.09L62.05 39.09Q60.89 28.93 54 28.93L54 28.93Q47.36 28.93 45.95 39.09L45.95 39.09ZM92.81 9.28L92.81 51.82Q92.81 54.91 95.77 54.91L95.77 54.91Q98.19 54.91 101.07 54.35L101.07 54.35L101.07 59.73Q96.82 60.33 94.82 60.33L94.82 60.33Q87.19 60.33 87.19 52.84L87.19 52.84L87.19 9.28L92.81 9.28ZM128.81 9.28L128.81 51.82Q128.81 54.91 131.77 54.91L131.77 54.91Q134.19 54.91 137.07 54.35L137.07 54.35L137.07 59.73Q132.82 60.33 130.82 60.33L130.82 60.33Q123.19 60.33 123.19 52.84L123.19 52.84L123.19 9.28L128.81 9.28ZM162.07 24.12L162.07 24.12Q168.68 24.12 172.44 29.95L172.44 29.95Q175.68 34.80 175.68 42.61L175.68 42.61Q175.68 48.48 173.74 52.91L173.74 52.91Q170.16 61.14 161.93 61.14L161.93 61.14Q155.57 61.14 151.77 55.72L151.77 55.72Q148.32 50.77 148.32 42.61L148.32 42.61Q148.32 33.82 152.30 28.79L152.30 28.79Q156.09 24.12 162.07 24.12ZM161.93 29.14L161.93 29.14Q158.06 29.14 155.88 33.19L155.88 33.19Q153.95 36.74 153.95 42.61L153.95 42.61Q153.95 48.02 155.53 51.43L155.53 51.43Q157.71 56.11 162 56.11L162 56.11Q165.94 56.11 168.12 52.07L168.12 52.07Q170.05 48.52 170.05 42.68L170.05 42.68Q170.05 36.60 168.05 33.12L168.05 33.12Q165.90 29.14 161.93 29.14Z"/>
				{#each info_points as point }
					<text x='{point.x}' y='100' stroke='none' fill='rgb(80,200,90)'vector-effect="non-scaling-size" >{point.index}</text>
				{/each}
			</g>
			<g bind:this={canvasElt} > 
				{#each line_points as point }
					<line x1='{point.x}' x2='{point.x}' y1='0' y2='110' height='100' stroke-width="2"  stroke="rgb(0,0,0)" vector-effect="non-scaling-stroke" />
				{/each}
			</g>
		</svg>
	</div>
		
	<div style="border: solid 2px navy;padding: 4px;background-color:#EFEFEF;">
		<div class="blg-ctrl-panel" style="display:inline-block;vertical-align:bottom;background-color:#EFFFFE" >
			<span style="color:navy;font-weight:bold">Boxes</span>
			<input type=number class="blg-ctl-number-field" bind:value={box_delta} min=1 max=4>

			<button class="blg-ctl-button" on:click={handleClick_remove}>
				-
			</button>

			<button class="blg-ctl-button"  on:click={handleClick_add}>
				+
			</button>
		</div>
		<div class="blg-ctrl-panel" style="display:inline-block;vertical-align:bottom;background-color:#EFEFFE" >
			<button on:click={handleClick_fetch}>
				search
			</button>
			<div style="display:inline-block;">
			&nbsp;<input type=text bind:value={search_topic} on:keypress={handle_keyDown} >
			</div>
		</div>
		<div class="blg-ctrl-panel" style="display:inline-block;background-color:#FFFFFA" >
			
			<button class="blg-ctl-button" on:click={handleClick_first}>&le;</button>
			<input class="blg-ctl-slider" type=range bind:value={article_index} min=1 max={article_count} on:change={handle_index_changed} >
			<button class="blg-ctl-button" on:click={handleClick_last}>&ge;</button>
			<input type=number class="blg-ctl-number-field" bind:value={article_index} min=1 max={article_count} on:change={handle_index_changed} >
			of {article_count}
		</div>
		<div class="blg-ctrl-panel" style="display:inline-block;background-color:#FFFFFA" >
			<select bind:value={search_ordering} on:change="{handle_order_change}">
				{#each qlist_ordering as ordering}
					<option value={ordering}>
						{ordering.text}
					</option>
				{/each}
			</select>
		</div>
	</div>

  
	<div class="blg-grid-container">
		<ThingGrid things={things} thing_component={Thing} on:message={handleMessage} />
	</div>

	
</div>


<FloatWindow title={current_thing.title + '...'}  index={0} scale_size_array={all_window_scales} >
	<FullMonth {...current_thing}  on:message={handleEventPlanningMessage} />
</FloatWindow>


<FloatWindow title="Day Planner" index={1} scale_size_array={all_window_scales} >
	<DayEvents {...current_day_data} bind:day_event_count/>
</FloatWindow>



<style>


	.calendar-admin-slider {
		border: solid 2px rgb(9, 84, 9);
		padding: 4px;
		background-color:white;
		height: 120px;
	}

	.blg-grid-container {
		border-top : solid 2px green;
		padding-top: 4px;
		height: calc(100vh - 240px);
		overflow-y:scroll;
		background-color: rgb(250, 250, 242);
	}

	.blg-ctl-button {
		max-width: 20px;
		border-radius: 6px;
	}

	.blg-ctl-slider {
		height: 35px;
		vertical-align: bottom;
	}

	.blg-ctl-number-field {
		max-width: 60px
	}

	.blg-ctrl-panel {
		padding:2px;
		padding-left:6px;
		padding-right:4px;
		margin:0px;
		border: none;
	}

	.sel-titles {
		display:inline-block;
		width:35%;
		font-weight:bold;
		color:black;
		font-size:0.75em;
		margin: 6px;
	}


</style>
