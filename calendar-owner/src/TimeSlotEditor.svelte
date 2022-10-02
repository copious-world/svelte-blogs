<script>
    import { createEventDispatcher } from 'svelte';
	import DayEvents from './DayEvents.svelte'
    import { EventDays } from 'event-days'
    const Slot = EventDays.Slot


	const dispatch = createEventDispatcher();

    export let name
    export let slot_name
    export let start_day
    export let end_day
    export let description
    export let pattern
    export let activity
    export let begin_at
    export let end_at
    export let start_time
    export let end_time

    let day_event_count = 0
    let external_update = false


    let model_day_data = {
        "day" : 0,
        "monthstr"  : "",
        "all_day_list" : [],
        "day_event_count" : 0
    }

    const ONE_HALF_HOUR = (3600*500)
    const ONE_MINUTE = (60*1000)
    const USE_AS_OPEN = "open"
    const USE_AS_BLOCK = "block"
    const USE_AS_MEETING = "meeting"
    const USE_AS_ACTIVITY = "activity"
    

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
        for ( let i = 0; i < 48; i++ ) {
            //
            let hour = d_date.getHours()
            let minutes = d_date.getMinutes()
            let blocked = USE_AS_OPEN
            //
            let time = d_date.getTime()
            if ( ( (typeof begin_at === 'number') && (typeof end_at == 'number') ) && (begin_at <= time) && (time <= end_at) ) {
                if ( ( activity !== USE_AS_OPEN ) && ( activity !== USE_AS_BLOCK ) ) {
                    blocked = ( activity !== USE_AS_MEETING ) ? USE_AS_ACTIVITY : activity
                }
            } 
            //
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
        return all_day_list
    }


    function check_entered_times() {
        let time_slots = model_day_data.all_day_list
        let beg_time = -1
        let end_time = -1

        let use_key = USE_AS_OPEN
        for ( let a_slot of time_slots ) {
            if ( (a_slot.use !== USE_AS_OPEN) && (use_key === USE_AS_OPEN) ) {
                beg_time = a_slot.begin_at
                end_time = beg_time + (a_slot.how_long*ONE_MINUTE)
                use_key = a_slot.use
            } else if ( (a_slot.use !== use_key) && (beg_time >= 0 ) ) {  // !== use_key ends it
                break
            }
        }
        if ( (beg_time >= 0) && (end_time >= 0) ) {
            return [beg_time,end_time]
        }

        return [begin_at,end_at]
    }


    let yes_sunday = false
    let yes_monday = false
    let yes_tuesday = false
    let yes_wednesday = false
    let yes_thursday = false
    let yes_friday = false
    let yes_staturday = false
    //
    let maybe_sunday = false
    let maybe_monday = false
    let maybe_tuesday = false
    let maybe_wednesday = false
    let maybe_thursday = false
    let maybe_friday = false
    let maybe_staturday = false

    let pattern_update = [].concat(pattern)
    $: if ( pattern ) {
        yes_sunday = pattern[0]
        yes_monday = pattern[1]
        yes_tuesday = pattern[2]
        yes_wednesday = pattern[3]
        yes_thursday = pattern[4]
        yes_friday = pattern[5]
        yes_staturday = pattern[6] 
        pattern_update = [].concat(pattern)
        //
        let dlist = fill_model_day()
        model_day_data.all_day_list = dlist     // this is also a svelte weirdness...
        setTimeout(patterns_do,0)  // this does have to happen
    }

    function patterns_do() {
        maybe_sunday = yes_sunday
        maybe_monday = yes_monday
        maybe_tuesday = yes_tuesday
        maybe_wednesday = yes_wednesday
        maybe_thursday = yes_thursday
        maybe_friday = yes_friday
        maybe_staturday = yes_staturday
    }


    let type_of_activity = [
        { id: 0, text: USE_AS_OPEN },
		{ id: 1, text: `meeting` },
		{ id: 2, text: `teaching` },
		{ id: 3, text: `music` },
        { id: 3, text: `travel` }
	];

	let selected_activity;
	let answer_activity = '';


    function figure_activity(activity) {
        for ( let act of type_of_activity ) {
            if ( act.text === activity ) {
                return act
            }
        }
        return type_of_activity[0]
    }

    $: selected_activity = (!(typeof activity === 'string' ) || !(activity.length)) ? type_of_activity[0] : figure_activity(activity)

    function handle_delete(ev) {
        dispatch('message', {
			"type": 'command',
			"cmd": 'delete-time-slot'
		})
    }

    function handle_save(ev) {
        pattern_update = [ maybe_sunday, maybe_monday, maybe_tuesday, maybe_wednesday, maybe_thursday, maybe_friday, maybe_staturday ]
        let [udpate_begin_at,update_end_at] = check_entered_times()
        //
        let name_changed = false
        let update_name = slot_name
        if ( name.indexOf(slot_name) !== 0 ) {
            name_changed = true
            name = `${slot_name}-${start_time}`
        }
        //
        dispatch('message', {
			"type": 'command',
			"cmd": 'save-time-slot',
            "status" : { "name_change" : name_changed },
            "time_slot_data" : {
                "name" : name,
                "slot_name" : update_name,
                "description" : description,
                "begin_at" : udpate_begin_at,
                "end_at" : update_end_at,
                "pattern" : pattern_update,
                "start_time" : start_time,
                "end_time" : end_time,
                "activity" : selected_activity.text
            }
		})

    }



</script>

<div class="contain-all">
    <div class="edit-controls">
        <div class="e-control-row"> <button on:click={handle_save}>save</button> <button on:click={handle_delete}>delete</button> </div>
        <div class="e-control-row">
            <span style="font-weight:bold;color:rgb(40,130,90)">Days of Week Pattern:</span>
            <span style="font-weight:bold">S </span><input type="checkbox" bind:checked={maybe_sunday} />&nbsp;
            <span style="font-weight:bold">M </span><input type="checkbox" bind:checked={maybe_monday} />&nbsp;
            <span style="font-weight:bold">T </span><input type="checkbox" bind:checked={maybe_tuesday} />&nbsp;
            <span style="font-weight:bold">W </span><input type="checkbox" bind:checked={maybe_wednesday} />&nbsp;
            <span style="font-weight:bold">Th </span><input type="checkbox" bind:checked={maybe_thursday} />&nbsp;
            <span style="font-weight:bold">F </span><input type="checkbox" bind:checked={maybe_friday} />&nbsp;
            <span style="font-weight:bold">S </span><input type="checkbox" bind:checked={maybe_staturday} />
        </div>
    </div>
    <div class="controls_panels">
        <!--    LEFT PANEL -->
        <div class="controls-column"  style="font-size:smaller">
            <div>
                <label for="name-tse-1" >Name:</label> <input id="name-tse-1" type="text" bind:value={slot_name} />
            </div>
            <div>
                <span>DB KEY:</span> {name}
            </div>
            <div>
            <span>{start_time}, {end_time}</span>
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
        <!--    OTHER PANEL -->
        <div class="controls-column" style="padding:0px">
            <DayEvents {...model_day_data} bind:day_event_count bind:external_update={external_update} />
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
