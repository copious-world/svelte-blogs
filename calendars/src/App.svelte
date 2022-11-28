<script>
	export let name;

	import FullMonth from './MonthFull.svelte';
	import Thing from './Thing.svelte'
	import DayEvents from './DayEvents.svelte'
	import RequestChangeAlerts from './RequestChangeAlerts.svelte'
	import ClockSelections from './ClockSelections.svelte'
	//
	import ThingGrid from 'grid-of-things';
	import FloatWindow from 'svelte-float-window';


	import Clock from 'svelte-clock'


	import { process_search_results, place_data, merge_data, make_empty_thing, link_server_fetch } from '../../common/data-utils.js'
	import { popup_size } from '../../common/display-utils.js'
	import { get_search } from "../../common/search_box.js"

	import { EventDays } from 'event-days'
	import {add_ws_endpoint} from '../../common/ws-relay-app'
	import tl_subr from '../../calendar-common/subcription_handlers'
	import cnst from '../../calendar-common/constants'
	import local_presets from '../../calendar-common/schedule-preset'
	import {timestamp_db} from '../../common/timestamp_db'


	import { onMount } from 'svelte';

	let session = ""
	let going_session = ""

	let g_slot_definitions = false
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

	let force_day_event_update = false
	let g_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;


	let g_active_slot_list = []
	function update_active_slot_list(d_date,slot_defs) {
		let slots = []
		for ( let s_label in slot_defs ) {
			let slot = slot_defs[s_label]
			if ( slot ) {
				let dt = d_date.getTime()
				if ( (dt >= slot.start_time) && (dt <= slot.end_time) ) {
					slots.push(slot)
				}
			}
		}
		return slots
	}

	function best_for_hour(slot_list,time,blocked) {
		let slots_of_hour = []
		for ( let slot of slot_list ) {
			if ( slot.begin_at <= time && time <= slot.end_at ) {
				slots_of_hour.push(slot)
			}
		}
		//
		if ( slots_of_hour.length === 0 ) {
			return blocked
		}
		if ( slots_of_hour.length === 1 ) {
			return slots_of_hour[0].use
		}
		// else
		let priority = -1
		let pindex = -1
		for ( let i = 0; i < slots_of_hour.length; i++ ) {
			let slot = slots_of_hour[i]
			let tspan = slot.end_time - slot.start_time
			let toffset = time - slot.start_time
			let partial = toffset/tspan
			let bias = slot.offset_bias(partial) ///  from the definition of a slot...
			if ( bias > priority ) {
				priority = bias
				pindex = i
			}
		}
		//
		return slots_of_hour[pindex].use
	}

	// --- ReqSlot --- --- --- --- --- --- --- --- --- ---
	class ReqSlot extends Slot {
		//
		constructor(label,begin_at,end_at,info,d_date,day_key) {
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
			this.month = d_date.getMonth()
			this.year = d_date.getFullYear()
			this.mo_key = day_key
			this.accepted = false
			this.revision_state = cnst.EVENT_IN_NEGOTIATION
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

		copy_relevant_fields(sl,a_slot) {
			sl.label = a_slot.label
			sl.person_id = a_slot.person_id
			sl.email = a_slot.email
			sl.contact_phone = a_slot.contact_phone
			sl.on_zoom = a_slot.on_zoom
			sl.in_person = a_slot.in_person
			sl.user_id = a_slot.user_id
			sl.how_long = a_slot.how_long
			sl.month = a_slot.month
			sl.year = a_slot.year
			sl.mo_key = a_slot.mo_key
		}


		add_slot(a_slot) {
			super.add_slot(a_slot)

			let a_list = this.all_day_list
			for ( let sl of a_list ) {

				if ( ( sl.begin_at >= a_slot.begin_at ) &&  (sl.begin_at < a_slot.end_at) ) {
					sl.use = a_slot.use
				}
				this.copy_relevant_fields(sl,a_slot)
			}

			this.event_count++
			this.has_events = true
			force_day_event_update = true
		}

		remove_slot(a_slot) {
			super.remove_slot(a_slot)
			if ( this.event_count > 0 ) { this.event_count-- }
			if ( this.event_count === 0 ) {
				this.has_events = false
			}
			let d_date = new Date(a_slot.begin_at)
			let replacer = new ReqSlot("",a_slot.begin_at,0,{
														"index" : a_slot.index,
														"blocked" : USE_AS_OPEN,
														"on_half_hour" : a_slot.on_half_hour,
													},d_date)
			super.add_slot(replacer)

			let all_day_list = this.all_day_list
			for ( let i = 0; i < 48; i++ ) {
				let sl = all_day_list[i]
				if ( ( sl.begin_at >= a_slot.begin_at ) &&  (sl.begin_at <= a_slot.end_at) ) {
					sl.use = USE_AS_OPEN
					this.copy_relevant_fields(sl,replacer)
				}
			}
			//
			force_day_event_update = true
		}
		//

		fill_day(year,month,key) {
			let d_date = new Date(year,month,this.day,0,0,0);  // these have been passed

			let dkey = d_date.toLocaleDateString('en-US',local_presets.time_zone)

			let mnight = local_presets.saturdays[dkey]
			if ( mnight !== undefined ) {

//console.log("SATURDAY",dkey)
				let day_defs = local_presets.presets.saturday
				for ( let def of day_defs ) {
					let ev = Object.assign({},def)
					ev.begin_at = mnight + def.begin_at*ONE_HOUR
					ev.end_at = mnight + def.end_at*ONE_HOUR
					ev.how_long = (def.end_at - def.begin_at)*60
					timestamp_db.add(ev)
				}
			} else {
				mnight = local_presets.sundays[dkey]
				if ( mnight !== undefined ) {
//console.log("SUNDAY",dkey)
					let day_defs = local_presets.presets.sunday
					for ( let def of day_defs ) {
						let ev = Object.assign({},def)
						ev.begin_at = mnight + def.begin_at*ONE_HOUR
						ev.end_at = mnight + def.end_at*ONE_HOUR
						ev.how_long = (def.end_at - def.begin_at)*60
						timestamp_db.add(ev)
					}
				} else {
					let day_def = local_presets.holidays[dkey]
					if ( day_def !== undefined ) {
//console.log("HOLIDAY",dkey)
						let ev = Object.assign({},day_def)
						ev.how_long = 24*60
						timestamp_db.add(ev)
					} else {
						let day_defs = local_presets.presets.daily
						let a_day = new Date(dkey)
						mnight = a_day.getTime()
//console.log("DAILY",dkey)
						for ( let def of day_defs ) {
							let ev = Object.assign({},def)
							ev.begin_at = mnight + def.begin_at*ONE_HOUR
							ev.end_at = mnight + def.end_at*ONE_HOUR
							ev.how_long = (def.end_at - def.begin_at)*60
							timestamp_db.add(ev)
						}
					}
				}
			}

			let all_day_list = this.all_day_list
			//
			//
			for ( let i = 0; i < 48; i++ ) {
				//
				let minutes = d_date.getMinutes()
				let time = d_date.getTime()
				//
				let blocked = USE_AS_OPEN
				all_day_list[i] = new ReqSlot("",time,0,{
														"index" : i,
														"blocked" : blocked,
														"on_half_hour" : (minutes !== 0)
													},d_date,key)
				//
				let ev = timestamp_db.find_event(time)
				if ( !!(ev) ) {
					all_day_list[i].use = ev.use
					all_day_list[i].end_at = ev.end_at
					all_day_list[i].how_long = ev.how_long
					if ( ev.how_long > 30 ) {
						let time_left = (ev.how_long - 30)
						while ( (time_left > 0) && (i < 48) ) {
							i++;
							time_left -= 30
							time += ONE_HALF_HOUR
							d_date = new Date(time)
							minutes = d_date.getMinutes()
							//
							all_day_list[i] = new ReqSlot("",time,0,{
														"index" : i,
														"blocked" : ev.use,
														"on_half_hour" : (minutes !== 0)
													},d_date,key)
							all_day_list[i].begin_at = time
							all_day_list[i].how_long = (all_day_list[i-1].how_long - 30)
						}
					}
				}
				//
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


	let g_request_alert_parameters = false
	let parameter_setup = false
	$: g_request_alert_parameters = parameter_setup

	let g_user_id = "smith"

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
		if ( agenda ) {
			agenda.has_events = current_day_data.has_events
			agenda.event_count = current_day_data.event_count
		}
		things = things
	}

	$: if ( force_day_event_update ) {
		let mo = things[0]
		things = things
		force_day_event_update = false
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
		"total_events" : 0,
		"time_zone" : g_timezone
	}

	let thing_template = make_empty_thing(model_month_entry,true)

	function fill_cal(mentry) {
		//
		let cmap = mentry.cal.map
		for ( let ky in cmap ) {
			//
			/*
			let agenda = cmap[ky]
			//
			let d_date = new Date(mentry.year,mentry.month,agenda.day);  // these have been passed
			let all_day_kys = Object.keys(agenda.all_day)
			let all_day_list = all_day_kys.map((ky) => { return agenda.all_day[ky] })
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
			agenda.all_day_list = all_day_list
			agenda.event_count = 0
			agenda.has_events = false
			agenda.key = ky
			*/
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
	onMount(async () => {
		//
		session = await window.retrieve_session()
		g_slot_definitions = await window.retrieve_slots()   // general publication
		//

		window.addEventListener("resize", (e) => {
			//
			let scale = popup_size()
			//
			window_scale.h = scale.h; 
			window_scale.w = scale.w;
			//
		})

		let topic_group = cnst.CALENDAR_TOPIC_GROUP
		let api_path = "owner"
		let subscriptions = { 			// provide updates for user displays even though the search DB updates
			"in-request" : {			// showing new request as they are made everywhere  (these are for everyone)
				"path" : cnst.USER_CHAT_PATH,
				"topic" : cnst.REQUEST_EVENT_TOPIC,
				"handler" : async (message) => {
					let status = (message.data !== undefined)
					if ( status ) {
						let req = messsage.data
						injest_request(req)
					}
				}
			},
			"in-state-changes" : {		// the mantainer accepts the request for this user
				"path" : cnst.USER_CHAT_PATH,
				"topic" : g_user_id,
				"handler" : async (message) => {
					let status = (message.data !== undefined)
					if ( status ) {
						parameter_setup = message.data
						setTimeout(() => { start_floating_window(2) },5)
						data_fetcher() // retrieve the changes that this mesage is telling us about
					}
				}
			},
			"in-request-drop" : {		// from the owner -- this event is dropped by the owner
				"path" : cnst.USER_CHAT_PATH,
				"topic" : `${g_user_id}-${cnst.REQUEST_EVENT_DROP_TOPIC}`,		// cancel meeting, drop and create new (different time)
				"handler" :   async (message) => {
					let status = (message.data !== undefined)
					if ( status ) {
						parameter_setup = message.data
						tl_subr.drop_request(parameter_setup,things)
						setTimeout(() => { start_floating_window(2) },5)
						data_fetcher() // retrieve the changes that this mesage is telling us about
					}
				}
			},
			"in-timeline" : {
				"path" : cnst.USER_CHAT_PATH,
				"topic" : cnst.APPRISE_NEW_MONTH_DATA,
				"handler" :   async (message) => {
					// The user (public) will just fetch the slots of the existing months
					data_fetcher()
				}
			}

		}
		add_ws_endpoint(topic_group,cnst.DEFAULT_WS_CALENDAR_ACCESS,9797,api_path,subscriptions)
	})


	function present_assest_editing() {
		if ( going_session && (typeof window.launch_comment_editor === "function") ) {
			window.launch_asset_editor(going_session)
		}
	}


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


	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	//
	let g_event_window_tstarts = {}
	let g_timezone_shift = 0

	function handleEventPlanningMessage(event) {
		let data = event.detail
		day_data = data.day_info
		day_event_count = day_data.event_count

		// get events prev day, current, next
		// ----
		//  g_timezone_shift


		console.log(g_timezone_shift)

		start_floating_window(1,1.0,0.5);
		fix_z_topper(1);
	}
	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


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



	// ---- ---- ---- ---- ---- ---- ---- ----
	//
	function injest_request(req) {
		tl_subr.injest_request(req,things)
		data_fetcher()
	}


	function handleTimezoneUpdateMessage(event) {
		let tz_data = event.detail
		if ( tz_data ) {
			let clock_changes = tz_data.clocks
			if ( clock_changes ) {
				let reclocked = g_all_clocks.map((a_clock) => {
					let clock_ky = a_clock.tz_info
					let clck_change = clock_changes[clock_ky]
					if ( clck_change !== undefined ) {
						if ( clck_change ) {
							delete clock_changes[clock_ky]
							return a_clock
						} else {
							return false
						}
					}
					return a_clock
				})
				reclocked = reclocked.filter((el) => {
					return el
				})
				let add_on = Object.keys(clock_changes)
				for ( let clock_ky of add_on ) {
					let city = clock_ky.split('/')
					city = city[city.length-1]
					reclocked.push({ "label" : city, "timezone" : "+6", "tz_info" : clock_ky })
				}
				g_all_clocks = reclocked

			}
		}
	}


	// 
	let tz_city = g_timezone.split('/')[1]

	// ----
	let home_time = new Date()
	let g_home_timezone = g_timezone
	let home_tz_str = home_time.toLocaleTimeString("en-US", { timeZone: g_home_timezone })
	let home_tparts = home_tz_str.split(':')
	let home_hr_update = parseInt(home_tparts[0])

	let h_rest = home_tparts[2].split(' ')
	let h_night_n_day = h_rest[1].trim()

	if ( (h_night_n_day === "PM") && (home_hr_update !== 12) ) {
		home_hr_update += 12
	}
	let h_tz_date_str = home_time.toLocaleDateString("en-US", { timeZone: g_timezone })
	let home_extract_day = h_tz_date_str.split('/')[1]

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	let g_all_clocks = [
		//
		{ "label" : "New York", "timezone" : "+6", "tz_info" : "America/New_York"},
		{ "label" : "Boise", "timezone" : "+6", "tz_info" : "America/Boise"},
		{ "label" : "Dublin", "timezone" : "+6", "tz_info" : "Europe/Dublin"},
		{ "label" : "Gibraltar", "timezone" : "+6", "tz_info" : "Europe/Gibraltar"},

		{ "label" : "London", "timezone" : "+6", "tz_info" : "Europe/London"},
		{ "label" : "Berlin", "timezone" : "+6", "tz_info" : "Europe/Berlin"},
		{ "label" : "Los Angeles", "timezone" : "+6", "tz_info" : "America/Los_Angeles"},
		{ "label" : "Denver", "timezone" : "+6", "tz_info" : "America/Denver"},
		{ "label" : "Chicago", "timezone" : "+6", "tz_info" : "America/Chicago"},
		{ "label" : "Paris", "timezone" : "+6", "tz_info" : "Europe/Paris"},
		{ "label" : "Vienna", "timezone" : "+6", "tz_info" : "Europe/Vienna"},
		{ "label" : "Warsaw", "timezone" : "+6", "tz_info" : "Europe/Warsaw"},
		{ "label" : "Auckland", "timezone" : "+6", "tz_info" : "Pacific/Auckland"},
		{ "label" : "Tokyo", "timezone" : "+6", "tz_info" : "Asia/Tokyo"},
		{ "label" : "Sydney", "timezone" : "+6", "tz_info" : "Australia/Sydney"},
		{ "label" : "Singapore", "timezone" : "+6", "tz_info" : "Asia/Singapore"},
		{ "label" : "Perth", "timezone" : "+6", "tz_info" : "Australia/Perth"}
		// 
	]

	const g_time_zone_clocks = []

	for ( let tz of g_all_clocks ) {
		g_time_zone_clocks.push(tz.tz_info)
	}


	function select_time_zone(zone_pair) {
		tz_city = zone_pair.label
		g_timezone = zone_pair.tz_info


		let time = new Date()
		let tz_str = time.toLocaleTimeString("en-US", { timeZone: g_timezone })
		let tparts = tz_str.split(':')
		let hr_update = parseInt(tparts[0])

		let rest = tparts[2].split(' ')
		let night_n_day = rest[1].trim()

		if ( (night_n_day === "PM") && (hr_update !== 12) ) {
			hr_update += 12
		}
		//

		g_timezone_shift = hr_update - home_hr_update
		

		let tz_date_str = time.toLocaleDateString("en-US", { timeZone: g_timezone })
		let extract_day = tz_date_str.split('/')[1]

		for ( let a_thing of things ) {
			a_thing.time_zone = g_timezone
		}
		things = things
		
		console.log(home_hr_update,h_night_n_day, h_tz_date_str, home_extract_day, "::", hr_update, night_n_day, tz_date_str, extract_day, "::> ", (home_hr_update - hr_update))
	}


	function return_local_clock() {
		let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		//
		let tz_parts = timezone.split('/')
		let city = tz_parts[tz_parts.length - 1]
		let original_tz = { "label" : city, "timezone" : "+6", "tz_info" : timezone}
		select_time_zone(original_tz)
	}

	function launch_custom_clocks(ev) {
		start_floating_window(3);
	}

</script>



<div>

	<div style="border: solid 2px navy;padding: 4px;background-color:#EFEFEF;height:fit-content;width:99%">
		<div class="blg-ctrl-panel" style="display:inline-block;text-align:center;vertical-align:top;background-color:#EFFFFE;height:inherit;width:fit-content;" >
			<div  style="height:inherit;width:fit-content;white-space:nowrap;text-align:center;">
				<span style="color:navy;font-weight:bold">Boxes</span>
				<input type=number class="blg-ctl-number-field" bind:value={box_delta} min=1 max=4>
				<button class="blg-ctl-button" on:click={handleClick_remove}>
					-
				</button>
				<button class="blg-ctl-button"  on:click={handleClick_add}>
					+
				</button>
			</div>
			<button style="font-size:x-small;white-space:nowrap;"  on:click={launch_custom_clocks} >choose clocks</button>
		</div>
		<div class="blg-ctrl-panel" style="display:inline-block;vertical-align:top;background-color:#EFEFFE;width:calc(76vw - 8px);white-space: nowrap;" >
			<div style="height:60px;display:inline-block;cursor:pointer;vertical-align:top;" on:click={return_local_clock}>
				<Clock timezone={g_timezone} />
				<div style="text-align:center;font-size:60%;font-weight:bolder">
					{tz_city}
				</div>
			</div>
			<div style="display:inline-block;height:fit-content;width:calc(100% - 4px);overflow-x:scroll;padding:0px;white-space: nowrap;">
				{#each g_all_clocks as zone_pair}
				<div style="height:60px;display:inline-block;margin-right:4px;cursor:pointer;" on:click={() => {select_time_zone(zone_pair)} }>
					<Clock  timezone={zone_pair.tz_info} />
					<div style="text-align:center;font-size:60%;font-weight:bolder">
						{zone_pair.label}
					</div>
				</div>	
				{/each}
			</div>
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
	<DayEvents {...current_day_data} tz_hour_shift={g_timezone_shift} time_zone={g_timezone} event_starts={g_event_window_tstarts} ui_user_id={g_user_id}   bind:day_event_count/>
</FloatWindow>


{#if g_request_alert_parameters }
<FloatWindow title="Day Planner" index={2} scale_size_array={all_window_scales} >
	<RequestChangeAlerts {...g_request_alert_parameters}  />
</FloatWindow>
{/if}

<FloatWindow title="Timezone Clocks" index={3} scale_size_array={all_window_scales} >
	<ClockSelections time_zone_clocks={g_time_zone_clocks} on:message={handleTimezoneUpdateMessage} />
</FloatWindow>

<style>


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


</style>
