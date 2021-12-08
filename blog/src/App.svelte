<script>
	export let name;

	import FullThing from './ThingFull.svelte';
	import Thing from './Thing.svelte'
	import ThingGrid from 'grid-of-things';
	import FloatWindow from 'svelte-float-window';

	import { process_search_results, place_data, clonify, make_empty_thing, link_server_fetch } from '../../common/data-utils.js'
	import { popup_size } from '../../common/display-utils.js'
	import Selections from '../../common/Selections.svelte'
	import {link_picker,picker} from "../../common/link-pick.js"
	import {get_search} from "../../common/search_box.js"

	import { onMount } from 'svelte';

	let session = ""
	$: session = window.retrieve_session()


	const appsearch = 'search'  //   search later translated to songsearch (nginx conf by url)

	let qlist_ordering = [
		{ id: 1, text: `update_date` },
		{ id: 2, text: `score` },
		{ id: 3, text: `create_date` }
	];


	let all_link_picks = []

	let search_ordering = qlist_ordering[2];
	let search_topic = 'any'

	let g_max_title_chars = 20
	//
	let current_roller_title = ""
	let current_roller_subject = ""

	let thing_template = make_empty_thing()

	let current_thing = Object.assign({ "id" : 0, "entry" : 0 },thing_template)
	let app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template)
	//
	
	let window_scale = { "w" : 0.4, "h" : 0.6 }
	//
	window_scale = popup_size()
	let all_window_scales = []
	all_window_scales.push(window_scale)
	all_window_scales.push(window_scale)
	//
	onMount(() => {
		window.addEventListener("resize", (e) => {
			//
			let scale = popup_size()
			//
			window_scale.h = scale.h; 
			window_scale.w = scale.w;
			//
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
					start_floating_window(0);
				} else {
					current_roller_title = athing.title
					current_roller_subject = athing.subject
				}
			}
		}
	}

	function clickEmptyElement(thing_counter) {
		 let elem = clonify(app_empty_object)
		 elem.id = thing_counter
		 return elem
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
			things = place_data(things,other_things,article_index)
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
			let search_result = await link_server_fetch(`${prot}${sp}${srver}/${data_stem}/${rest}`,post_params, postData)

			let [a_i,lo,ot] = process_search_results(stindex,qstart,search_result,other_things)
			article_index = a_i
			article_count = lo
			other_things = ot

			if ( other_things !== false ) {
				things = place_data(things,other_things,article_index)
			}

		} catch (e) {
			alert(e.message)
		}
	}


	let count_value;
	const unsubscribe = picker.subscribe(value => {
		count_value = value;
		link_picker.map_picks(things)
	});


	function pop_up_selections(ev) {
		all_link_picks = link_picker.get_pick_values()
		start_floating_window(1);
	}
	
</script>



<div>

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
	<div style="border: solid 1px grey;padding: 4px;background-color:#F5F6EF;">
		<div class="sel-titles" >Title: {current_roller_title}</div><div class="sel-titles">Subject: {current_roller_subject}</div>
		<div class="sel-titles" style="width: 15%;"><button on:click={pop_up_selections}>show selections</button></div>
	</div>
  
	<div class="blg-grid-container">
		<ThingGrid things={things} thing_component={Thing} on:message={handleMessage} />
	</div>

	
</div>


<FloatWindow title={current_thing.title.substr(0,g_max_title_chars) + '...'}  index={0} scale_size_array={all_window_scales[0]} >
	<FullThing {...current_thing} />
</FloatWindow>


<FloatWindow title="Selection List"  index={1} scale_size_array={all_window_scales[1]} >
	<Selections link_picks={all_link_picks}  />
</FloatWindow>


<style>

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
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

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
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
