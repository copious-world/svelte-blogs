<script>
	export let name;

	import FullMonth from './MonthFull.svelte';
	import Thing from './Thing.svelte'
	import DayEvents from './DayEvents.svelte'
	import TimeSlotEditor from './TimeSlotEditor.svelte';
	//
	import ThingGrid from 'grid-of-things';
	import FloatWindow from 'svelte-float-window';

	import { process_search_results, place_data, merge_data, clonify, make_empty_thing, link_server_fetch } from '../../common/data-utils.js'
	import { popup_size } from '../../common/display-utils.js'
	import { get_search } from "../../common/search_box.js"
	import { first_day_of_relative_month, first_day_of_next_month } from "../../common/date_utils.js"


	import { EventDays } from 'event-days'
	import panzoom from 'panzoom';


	import { onMount } from 'svelte';

	let current_date = new Date()
	let title_months = [
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" 
	]
	
	// ----
	let current_time_slot = {
		"slot_name" : "",
    	"start_day" : "9/29",
    	"end_day"  : "10/29",
    	"description" : "This is a test of tests"
	}

	let panzoomOptions = {
		maxZoom: 5,
		minZoom: 1,
		initialZoom: 1,
		zoomDoubleClickSpeed: 1,
		transformOrigin: {x: 0, y: 0},
		zoomSpeed: 0.25,
		preserveAspecRatio: false,
		scaleFactors: { x : 1.0, y : 0.0 },
		smoothScroll : {
			reactZeroVelocity : true
		}
	};

	let x = 1000;
  	let y = 1000;

	let canvasElt = null;
	let controllerElt = null;
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


	let g_all_time_slots = []


	let line_points = []
	let info_points = []
	let divider_starts = -36;
	let division_width = 200
	let point = { x : divider_starts, y : 0 }
	let left_shift = divider_starts*division_width

	let info_delta = 3

	let width_control_reference_x = false


	for ( let i = 0; i < 1000; i++ ) {
		line_points.push({ x : (i*division_width + left_shift), y : 0, index : (divider_starts + i)})
		let mo_time = first_day_of_relative_month(current_date,(divider_starts + i))
		let da = new Date(mo_time)
		let mo_label = title_months[da.getMonth()] + " " + da.getFullYear()
		info_points.push({ x : (i*division_width + left_shift), y : 0, index : (divider_starts + i), label : mo_label })
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


	let g_last_known_transition = false
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


		let final_timeout = false
		panzoomInstance.on('zoom', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			info_points = repoint
			//
			//
			width_control.style.visibility = "hidden"
			//
			if ( final_timeout ) {
				clearTimeout(final_timeout)
				final_timeout = false
			}
			final_timeout = setTimeout(() => {
				let width_control_reference_object = false
				//
				g_all_time_slots = g_all_time_slots.map(oo => {
					//
					oo.x = oo.unit_x*tt.scaleX + tt.x
					oo.width = (oo.unit_width)*(tt.scaleX)
					//
					if ( oo.selected ) {
						width_control_reference_object = oo
					}
					//
					return oo
				})
				//
				if ( width_control_reference_object ) {
					width_control.style.visibility = "visible"
					let info_rect = width_control_reference_object
					width_control.setAttribute('x',(info_rect.x + info_rect.width - 5))
				}
				//
			},30)
			//
			g_last_known_transition = tt
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
			//
			//  update slots so that they can be found on a mouse click

			g_all_time_slots = g_all_time_slots.map(oo => {
				//
				oo.x = oo.unit_x*tt.scaleX + tt.x
				oo.width = (oo.unit_width)*(tt.scaleX)
				//
				return oo
			})

			//
			g_last_known_transition = tt
		});


		panzoomInstance.on('pan', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			//
			info_points = repoint
			//
			width_control.style.visibility = "hidden"
			//
			g_last_known_transition = tt
		});

		panzoomInstance.on('panend', (e) => {		/// left to right only
			let tt = e.getTransform()
			tt.y = 0

			let repoint = original_info_points.map(p => {
				let oo = Object.assign({},p)
				oo.x = oo.x*tt.scaleX + tt.x + (info_delta*tt.scaleX)
				return oo
			})
			//
			info_points = repoint
			//
			//
			g_last_known_transition = tt
		});


		panzoomInstance.on('decelerated-to-zero', (e) => {
			let tt = panzoomInstance.getTransform()
			//  update slots so that they can be found on a mouse click
			let width_control_reference_object = false
			g_all_time_slots = g_all_time_slots.map(oo => {
				//
				oo.x = oo.unit_x*tt.scaleX + tt.x
				if ( oo.selected ) {
					width_control_reference_object = oo
				}
				//
				return oo
			})
			//
			if ( width_control_reference_object ) {
				width_control.style.visibility = "visible"
				let info_rect = width_control_reference_object
				width_control.setAttribute('x',(info_rect.x + info_rect.width - 5))
			}
			//
			g_last_known_transition = tt
			//console.log(tt)
		})

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



	// ---- STARTING TIME SLOT EDITING CONTROLS


	function deselect_all_selected_rects(info_rect) {
		for ( let slot_bound of g_all_time_slots ) {
			if ( (info_rect !== slot_bound) && slot_bound.selected  ) {
				slot_bound.selected = false
				slot_bound.el.setAttribute('fill','black')
			}
		}
	}

	function show_width_control(info_rect) {
		width_control_reference_x = (info_rect.x + info_rect.width - 5)
		width_control.setAttribute('x',(info_rect.x + info_rect.width - 5))
		width_control.style.visibility = 'visible'
		deselect_all_selected_rects(info_rect)
	}

	function hide_width_control() {
		width_control_reference_x = false
		width_control.style.visibility = 'hidden'
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ----

	let g_starting_point = { x: 0, y : 0 } 
	let g_update_point = { x: 0, y : 0 }
	let g_tracking_mouse = false
	const c_TIME_SLOT_HEIGHT = 12

	let g_current_rect = false
	let g_tracking_rect = false

	let g_selected_svg_timeslot_rect = false

	let width_control = false


	function click_in_rect(point) {
		for ( let slot_bound of g_all_time_slots ) {
			if ( (slot_bound.x <= point.x) && (point.x <= (slot_bound.x + slot_bound.width)) ) {
				if ( (point.y >= slot_bound.y) && (point.y <= (slot_bound.y + c_TIME_SLOT_HEIGHT)) ) {
					return slot_bound
				}
			}
		}
		return false
	}
	//
	function handle_click_in_rect(found_rect) {
		//console.log(found_rect)
		g_tracking_rect = found_rect
		found_rect.el.setAttribute('fill','green')
		canvasElt.removeChild(found_rect.el)
		//
		let tt = g_last_known_transition
		//
		if ( tt ) {
			let x = found_rect.x
			let w = found_rect.width
			found_rect.el.setAttribute('x',x)
			found_rect.el.setAttribute('width',w)
		}
		//
		controllerElt.appendChild(found_rect.el)


		// begin tracking
	}


	let g_selected_ts = false

	function handle_editor(ev) {
		let option = ev.altKey
		let command = ev.metaKey
		if ( option || command ) {
			hide_width_control()
			const rect = ev.currentTarget.getBoundingClientRect()
			let maybe_update = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
			//
			let found_rect = click_in_rect(maybe_update)
			if ( found_rect ) {
				ev.preventDefault()
				ev.stopPropagation()
				if ( command ) {
					found_rect.selected = !found_rect.selected
					if ( found_rect.selected ) {
						g_selected_ts = true
						g_selected_svg_timeslot_rect = found_rect
						show_width_control(found_rect)
						found_rect.el.setAttribute('fill','darkorange')
						//
						rect_to_time_slot_editor(found_rect)
					} else {
						g_selected_ts = false
						hide_width_control()
						found_rect.el.setAttribute('fill','black')
					}
				} else {
					handle_click_in_rect(found_rect)
					g_starting_point = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
					found_rect.delta_x = g_starting_point.x - found_rect.x
					found_rect.delta_y = g_starting_point.y - found_rect.y
				}
			} else {

				deselect_all_selected_rects(false)

				g_tracking_mouse = true
				g_starting_point = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
				g_update_point = maybe_update
				const  svgns = "http://www.w3.org/2000/svg";
				//const  xlinkns = "http://www.w3.org/1999/xlink";

				let n_rect = document.createElementNS(svgns, "rect");
				// rect.setAttributeNS(xlinkns, "href", "#MidCLine1");
				n_rect.setAttribute("y", g_update_point.y );
				n_rect.setAttribute("x", g_update_point.x );
				n_rect.setAttribute("height", `${c_TIME_SLOT_HEIGHT}px` );
				n_rect.setAttribute("width", '3px' );

				controllerElt.appendChild(n_rect);

				g_current_rect = n_rect

				ev.preventDefault()
				ev.stopPropagation()
			}
		} else {
			controllerElt.style.cursor = "grabbing"
		}
	}



	function place_rect_in_scalable(created_rect,window_rect) {
		//
		controllerElt.removeChild(created_rect)
		let x = parseInt(created_rect.getAttribute('x'))
		let y = parseInt(created_rect.getAttribute('y'))
		let w = parseInt(created_rect.getAttribute('width'))
		if ( w < 5 ) return false
		//
		let tt = g_last_known_transition
		//
		if ( tt ) {
			x = (x - tt.x)/tt.scaleX
			w = w/tt.scaleX
			created_rect.setAttribute('x',x)
			created_rect.setAttribute('width',w)
		}
		canvasElt.appendChild(created_rect)
		// ---- ---- ---- ---- ---- ---- ---- ----
		//
		let scx = tt ? tt.scaleX : 1.0
		let scy = tt ? tt.scaleY : 1.0

		let info = {
				'x' : window_rect.x,
				'y' : window_rect.y,
				'height' : window_rect.height,
				'width' : window_rect.width,
				//
				'unit_x' : x,
				'unit_y' : y,
				'unit_width' : window_rect.width/scx,
				'unit_height' : window_rect.height/scy,
				//
				'el' : created_rect,
				'selected' : false
			}

		return info

	}


	function handle_editor_end(ev) {
		const rect = ev.currentTarget.getBoundingClientRect()

		g_tracking_mouse = false
		controllerElt.style.cursor = "pointer"
		g_update_point = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
		//
		if ( g_current_rect ) {
			let recalc_width = 0
			recalc_width = g_update_point.x - g_starting_point.x
			if ( recalc_width < 3 ) recalc_width = 3
			g_current_rect.setAttribute('width',recalc_width)
			//
			let window_rect = {
				x : g_starting_point.x,
				y : g_starting_point.y,
				width : recalc_width,
				height : c_TIME_SLOT_HEIGHT
			}
			let rect_info = place_rect_in_scalable(g_current_rect,window_rect)
			//
			if ( rect_info ) g_all_time_slots.push(rect_info)
			//
			rect_to_time_slot_editor(rect_info)

			g_current_rect = false
		} else if ( g_tracking_rect ) {
			//
			let window_rect = {
				x : g_tracking_rect.x,
				y : g_tracking_rect.y,
				width : g_tracking_rect.width,
				height : g_tracking_rect.height
			}
			let rect_info = place_rect_in_scalable(g_tracking_rect.el,window_rect,true)
			//
			g_tracking_rect.x = rect_info.x
			g_tracking_rect.y = rect_info.y
			g_tracking_rect.unit_x = rect_info.unit_x
			g_tracking_rect.unit_y = rect_info.unit_y
			//
			rect_to_time_slot_editor(g_tracking_rect)
			//
			g_tracking_rect.el.setAttribute('fill','black')
			g_tracking_rect.selected = false
			g_tracking_rect = false
		}
	}


	function moving_mouse(ev) {
		if ( g_tracking_mouse ) {
			const rect = ev.currentTarget.getBoundingClientRect()
			g_update_point = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
			if ( g_current_rect ) {
				let recalc_width = 0
				recalc_width = g_update_point.x - g_starting_point.x
				if ( recalc_width < 3 ) recalc_width = 3
				g_current_rect.setAttribute('width',recalc_width)
			}
		} else if ( g_tracking_rect ) {
			//
			const rect = ev.currentTarget.getBoundingClientRect()
			g_update_point = { x: (ev.clientX - rect.x), y: (ev.clientY - rect.y) }
			//
			let el = g_tracking_rect.el
			let new_x = g_update_point.x
			let new_y = g_update_point.y

			g_tracking_rect.x = (new_x - g_tracking_rect.delta_x)
			g_tracking_rect.y = (new_y - g_tracking_rect.delta_y)
			 
			el.setAttribute('x',`${(new_x - g_tracking_rect.delta_x)}px`)
			el.setAttribute('y',`${(new_y - g_tracking_rect.delta_y)}px`)

		}
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ----

	let g_wc_start_point = false
	function manage_width(ev) {
		ev.preventDefault()
		ev.stopPropagation()

		const rect = ev.currentTarget.getBoundingClientRect()
		g_wc_start_point = { x: ev.clientX, y: ev.clientY }
		window.addEventListener('mousemove',width_tracking)
		window.addEventListener('mouseup',width_end_tracking)
	}

	function width_tracking(ev) {
		ev.preventDefault()
		ev.stopPropagation()
		if ( g_wc_start_point && width_control) {
			let maybe_update = { x: (ev.clientX - g_wc_start_point.x), y: (ev.clientY - g_wc_start_point.y) }
			g_wc_start_point = { x: ev.clientX, y: ev.clientY }
			//
			let cur_loc = parseInt(width_control.getAttribute('x'))
			let new_x = maybe_update.x + cur_loc

			if ( g_selected_svg_timeslot_rect ) {
				let tt = g_last_known_transition
				let scalex = tt ? tt.scaleX : 1.0
				let oo = g_selected_svg_timeslot_rect
				//
				let box_w = (new_x - oo.x)
				oo.width = box_w
				oo.unit_width = box_w/scalex
				oo.el.setAttribute('width',oo.unit_width)
				//
				rect_to_time_slot_editor(oo)
			}

			width_control.setAttribute('x',`${new_x}px`)
		}
	}

	function width_end_tracking(ev) {
		ev.preventDefault()
		ev.stopPropagation()
		window.removeEventListener('mousemove',width_tracking)
		window.removeEventListener('mouseup',width_end_tracking)
		if ( g_wc_start_point ) {
			if ( width_control ) {
				let maybe_update = { x: (ev.clientX - g_wc_start_point.x), y: (ev.clientY - g_wc_start_point.y) }
				g_wc_start_point = { x: ev.clientX, y: ev.clientY }
				//
				let cur_loc = parseInt(width_control.getAttribute('x'))
				let new_x = maybe_update.x + cur_loc
				//
				if ( g_selected_svg_timeslot_rect ) {
					let tt = g_last_known_transition
					let scalex = tt ? tt.scaleX : 1.0
					let oo = g_selected_svg_timeslot_rect
					//
					let box_w = (new_x - oo.x)
					oo.width = box_w
					oo.unit_width = box_w/scalex
					oo.el.setAttribute('width',oo.unit_width)
					//
					rect_to_time_slot_editor(oo)
				}
				//
				width_control.setAttribute('x',`${new_x}px`)
			}
			g_wc_start_point = false
		}
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ----

	function open_editor(ev) {
		// 
		start_floating_window(2)
	}


	let edit_op_possibly_delete = false

	function handle_delete() {
		if ( edit_op_possibly_delete ) {
			let idx = g_all_time_slots.indexOf(edit_op_possibly_delete)
			if ( idx >= 0 ) {
				g_all_time_slots.splice(idx,1)
				let svg_el = edit_op_possibly_delete.el
				if ( svg_el ) {
					canvasElt.removeChild(svg_el)
				}
			}
		}
	}

	function save_time_slot() {
		let keep_it  = edit_op_possibly_delete
	}

	function handle_time_slot_editor(event) {
		let cmd_dscr = event.detail
		if ( cmd_dscr.type === "command" ) {
			switch ( cmd_dscr.cmd ) {
				case 'delete-time-slot' : {
					handle_delete() 
					break;
				}
				case 'save-time-slot' { 
					save_time_slot()
					break
				}
			}
		}
	}

	//

	function rect_to_time_slot_editor(found_rect) {
		edit_op_possibly_delete = found_rect
		//
		let disp_offset = found_rect.unit_x
		let disp_end = found_rect.unit_width + disp_offset
		let pitch = division_width
		//
		let mo_start = Math.trunc(disp_offset/pitch)
		let mo_end = Math.trunc(disp_end/pitch)
		//
		let cday = new Date()
		let d1 = first_day_of_relative_month(cday,mo_start)
		let d2 =  first_day_of_relative_month(cday,mo_end)
		//
		let mo_of_d1 = new Date(d1)
		let mo_of_d2 = new Date(d2)

		let n_d1 = first_day_of_next_month(mo_of_d1)
		let n_d2 = first_day_of_next_month(mo_of_d2)

		// start
		let partial_mo = (disp_offset % pitch)/pitch
		let t1_partial = (n_d1 - d1)*partial_mo
		d1 += t1_partial
		// end
		partial_mo = (disp_end % pitch)/pitch
		let t2_partial = (n_d2 - d2)*partial_mo
		d2 += t2_partial
		//
		let mody_of_d1 = new Date(d1)
		let mody_of_d2 = new Date(d2)
		//
		current_time_slot.start_day = mody_of_d1.toLocaleDateString()
		current_time_slot.end_day = mody_of_d2.toLocaleDateString()
	}

</script>
<div>
	<div class="calendar-admin-slider" >
		<svg style="width:100%">
			<!-- this is the draggable root -->
			<g>
				{#each info_points as point }
					<text x='{point.x}' y='100' stroke='none' fill='rgb(50,130,60)' vector-effect="non-scaling-size" font-size='12' font-weight='bold' >{point.label}</text>
				{/each}
			</g>
			<g bind:this={canvasElt} cursor='pointer' > 
				{#each line_points as point}
					{#if point.x < 0 } 
						<rect x='{point.x}' y='-2' height='114' width='{division_width}' stroke-width='1' stroke="rgb(0,0,0)" fill='rgba(155,155,155,0.25)' ></rect>
					{:else}
						<line x1='{point.x}' x2='{point.x}' y1='0' y2='110'  stroke-width='2'  stroke="rgb(0,0,0)" vector-effect="non-scaling-stroke" />
					{/if}
				{/each}
			</g>
			<g bind:this={controllerElt} class="cursor-grabber" on:mousedown={handle_editor} on:mouseup={handle_editor_end} on:mousemove={moving_mouse}>
				<rect x='0' y='-2' height='114' width='100%' stroke-width='1' stroke="rgb(0,0,0)" fill='rgba(255,255,255,0.01)'></rect>
				<svg bind:this={width_control}  style="visibility:hidden" x="-5">
					<line x1='5' x2='5' y1='0' y2='110'  stroke-width='3'  stroke="rgb(245,220,100)" vector-effect="non-scaling-stroke" />
					<polygon points="5 0, 0 6, 10 6"/>
					<circle cx='5' cy='50' r='5' fill='rgba(255,50,0,0.9)'  on:mousedown={manage_width} on:mouseup={width_end_tracking} on:mousemove={width_tracking}/>
					<polygon points="5 110, 0 105, 10 105"/>
				</svg>
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
		{#if g_selected_ts }
		<div class="blg-ctrl-panel" style="display:inline-block;vertical-align:top;background-color:#DEEEDE" >
			<button on:click={open_editor} style="color:mediumvioletred;font-weight:bold;font-size:smaller">
				Edit
			</button>
		</div>
		{/if}
		<div class="blg-ctrl-panel" style="display:inline-block;vertical-align:top;background-color:#EFEFFE" >
			<button on:click={handleClick_fetch}  style="font-size:smaller" >
				Update
			</button>
			<div style="display:inline-block;">
			&nbsp;<input type=text bind:value={search_topic} on:keypress={handle_keyDown} style="font-size:smaller">
			</div>
		</div>
		<div class="blg-ctrl-panel" style="display:inline-block;background-color:#FFFFFA" >
			<button class="blg-ctl-button" on:click={handleClick_first}>&le;</button>
			<input class="blg-ctl-slider" type=range bind:value={article_index} min=1 max={article_count} on:change={handle_index_changed} >
			<button class="blg-ctl-button" on:click={handleClick_last}>&ge;</button>
			<input type=number class="blg-ctl-number-field" bind:value={article_index} min=1 max={article_count} on:change={handle_index_changed} >
			of {article_count}
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


<FloatWindow title="Time Slot Editor" index={2} scale_size_array={all_window_scales} >
	<TimeSlotEditor {...current_time_slot} on:message={handle_time_slot_editor} />
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

	.cursor-grabber {
		cursor: pointer;
	}

	.cursor-grabbing:focus {
		cursor: grabbing;
	}

</style>
