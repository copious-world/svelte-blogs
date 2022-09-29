<script>
    import { createEventDispatcher } from 'svelte';
	import DayEvents from './DayEvents.svelte'
    import { EventDays } from 'event-days'
    const Slot = EventDays.Slot


	const dispatch = createEventDispatcher();

    export let slot_name
    export let start_day
    export let end_day
    export let description

    let model_day_data = {
        "day" : 0,
        "monthstr"  : "",
        "all_day_list" : [],
        "day_event_count" : 0
    }

    const ONE_HALF_HOUR = (3600*500)
    const USE_AS_OPEN = "open"
    const USE_AS_BLOCK = "block"
    

    let is_open = true

    class TSSlot extends Slot {
		//
		constructor(label,begin_at,end_at,info,d_date) {
			super(label,begin_at,end_at)
			this.index = info.index
			this.label = ""
			this.time = d_date.toLocaleTimeString()
			this.use = info.blocked
			this.on_hour = USE_AS_OPEN
			this.on_half_hour = info.on_half_hour
			this.changed =  false
			this.how_long =  15
		}
		//
	}



    function fill_model_day() {
        let nn = new Date()
        let d_date = new Date(nn.getFullYear(),nn.getMonth(),nn.getDate());  // these have been passed
        let mdd = model_day_data 
        let all_day_list = mdd.all_day_list
        //
        //
        for ( let i = 0; i < 48; i++ ) {
            //
            let hour = d_date.getHours()
            let minutes = d_date.getMinutes()
            let blocked = USE_AS_OPEN
            //
            let time = d_date.getTime()
            all_day_list[i] = new TSSlot("",time,0,{
                                                    "index" : i,
                                                    "blocked" : blocked,
                                                    "on_half_hour" : (minutes !== 0)
                                                },d_date)
            time += ONE_HALF_HOUR
            d_date = new Date(time)
        }
        // --  -- 
        mdd.all_day_list = all_day_list
        mdd.event_count = 0
        mdd.has_events = false
        mdd.monthstr = "Time Slot"
        //mdd.key = key

    }


    fill_model_day()

    let yes_sunday = false
    let yes_monday = false
    let yes_tuesday = false
    let yes_wednesday = false
    let yes_thursday = false
    let yes_friday = false
    let yes_staturday = false


    let type_of_activity = [
		{ id: 1, text: `meeting` },
		{ id: 2, text: `teaching` },
		{ id: 3, text: `music` },
        { id: 3, text: `travel` }
	];

	let selected_activity;
	let answer_activity = '';



    function handle_delete(ev) {
        dispatch('message', {
			"type": 'command',
			"cmd": 'delete-time-slot'
		})
    }

    function handle_save(ev) {
        dispatch('message', {
			"type": 'command',
			"cmd": 'save-time-slot'
		})
    }

</script>

<div class="contain-all">
    <div class="edit-controls">
        <div class="e-control-row"> <button on:click={handle_save}>save</button> <button on:click={handle_delete}>delete</button> </div>
        <div class="e-control-row">
            <span style="font-weight:bold;color:rgb(40,130,90)">Days of Week Pattern:</span>
            <span style="font-weight:bold">S </span><input type="checkbox" bind:checked={yes_sunday} />&nbsp;
            <span style="font-weight:bold">M </span><input type="checkbox" bind:checked={yes_monday} />&nbsp;
            <span style="font-weight:bold">T </span><input type="checkbox" bind:checked={yes_tuesday} />&nbsp;
            <span style="font-weight:bold">W </span><input type="checkbox" bind:checked={yes_wednesday} />&nbsp;
            <span style="font-weight:bold">Th </span><input type="checkbox" bind:checked={yes_thursday} />&nbsp;
            <span style="font-weight:bold">F </span><input type="checkbox" bind:checked={yes_friday} />&nbsp;
            <span style="font-weight:bold">S </span><input type="checkbox" bind:checked={yes_staturday} />
        </div>
    </div>
    <div class="controls_panels">
        <div class="controls-column">
            <div>
                <label for="name-tse-1" >Name</label> <input id="name-tse-1" type="text" bind:value={slot_name} />
            </div>
            <div>
                <label>
                    open <input type="radio" bind:group={is_open} name="openess" value={true} /> 
                </label>
                <label>
                    blocked <input type="radio" bind:group={is_open} name="openess" value={false} />
                </label>
            </div>
            {#if is_open }
                <div>
                    <select bind:value={selected_activity} on:change="{() => answer_activity = ''}">
                        {#each type_of_activity as question}
                            <option value={question}>
                                {question.text}
                            </option>
                        {/each}
                    </select>                
                </div>
            {/if}
            <div>
                <span for="sd-tse-1" >Start Day: </span>{start_day}
            </div>
            <div>
                <span for="ed-tse-1" >End Day: </span>{end_day} 
            </div>
            <div style="vertical-align: top;">
                <label for="txt2">Description</label> <textarea id="txt2" type="text" bind:value={description} />
            </div>
        </div>
        <div class="controls-column" style="padding:0px">
            <DayEvents {...model_day_data} />
        </div>
    </div>
</div>

<style>

.contain-all {
    border: solid 1px mediumseagreen;
    overflow-y: hidden;
	height:auto;
    min-height: 90%;
    max-height: 90%;
    width : 100%;
}

.controls_panels {
    border: solid 1px mediumseagreen;
    min-height: 100%;
    max-height: 100%;
    overflow: auto;
    display:block;
}

.controls-column {
    display:inline-block;
    vertical-align: top;
    min-width: 49%;
    padding:4px
}

.edit-controls {
    border: solid 1px mediumseagreen;   
}

.e-control-row {
    display:inline-block
}

label {
    font-weight: bold;
}

span {
    font-weight: bold;
    color: rgb(25, 97, 29);
}

button {
    font-size:78%;
}

div {
    border-bottom: 1px solid black;
    margin-bottom: 3px;
}
</style>
