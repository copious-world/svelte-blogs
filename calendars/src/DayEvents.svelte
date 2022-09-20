<script>
export let day
export let month
export let year
export let ev_list


const ONE_HOUR = (3600*1000)
const ONE_HALF_HOUR = (3600*500)
const ONE_QUARTER_HOUR = (3600*250)
const ONE_QUARTER_HOUR_MINUTES = (15)
const ONE_HALF_HOUR_MINUTES  = (30)

const USE_AS_BLOCK = "block"
const USE_AS_MEET = "meeting"
const USE_AS_ACTIVITY = "activity"
const USE_AS_OPEN = "open"


let maybe_event_time = "none scheduled"
let maybe_event_topic = ""
let maybe_event_id = ""
let maybe_event_email = ""
let maybe_event_contact_phone = ""
let maybe_event_zoom = false
let maybe_event_in_person = false
let maybe_event_index = 0
let maybe_event_half_hour = false
let maybe_event_how_long = 0
let maybe_event_lb = 15
let maybe_event_ub = 30
let maybe_event_step = 15

let show_editor = false

let ev_list_keys = []
$: ev_list_keys = Object.keys(ev_list)

let all_day = []
let monthstr = ""

let d_date = new Date(year,month,day);
$: {
    d_date = new Date(year,month,day)
    monthstr = d_date.toLocaleDateString()
    for ( let i = 0; i < 48; i++ ) {
        let hour = d_date.getHours()
        let minutes = d_date.getMinutes()
        let blocked = (hour < 10) || (hour >= 19) ? USE_AS_BLOCK : USE_AS_OPEN
        all_day[i] = {
            "index" : i,
            "time" : d_date.toLocaleTimeString(),
            "use" : blocked,
            "on_hour" : USE_AS_OPEN,
            "on_half_hour" : (minutes !== 0),
            "changed" : false
        }
        let time = d_date.getTime()
        time += ONE_HALF_HOUR
        d_date = new Date(time)
    }
}

let changed_event = false
$: if ( changed_event ) {
    changed_event = false
    let model_ev = all_day[maybe_event_index]
    model_ev.changed = true
    let total_time = maybe_event_how_long
    let ch_i = maybe_event_index
    while ( total_time > 0 ) {
        total_time -= 30
        ch_i++
        if ( total_time > 0 ) {
            let ntxt_slot = all_day[ch_i]
            ntxt_slot.changed = true
            ntxt_slot.use = model_ev.use
            all_day[ch_i] = ntxt_slot
        }
    }
    all_day[maybe_event_index] = model_ev
}


/*
if ( i == 28 ) {
    all_day[i].use = USE_AS_ACTIVITY
}
if ( i == 32 ) {
    all_day[i].use = USE_AS_MEET
    all_day[i].on_hour = USE_AS_MEET
}
*/

function hide_editor() {
    show_editor = false
}

function handle_change_request(hour_data) {
    //
    maybe_event_index = hour_data.index
    maybe_event_time = hour_data.time
    maybe_event_half_hour = hour_data.on_half_hour
    show_editor = true
    //

    let current_ub = 0
    let i = maybe_event_index
    while ( ++i < 48 ) {
        current_ub += ONE_HALF_HOUR_MINUTES
        let nxt_slot = all_day[i]
        if ( nxt_slot.use !== USE_AS_OPEN ) break
    }
    maybe_event_ub = current_ub
    //
}


function publish_event_request(ev) {
    let ev_data = all_day[maybe_event_index]
    ev_data.use = USE_AS_MEET
    hide_editor()
    changed_event = true
}



</script>
<div>
<h2>{monthstr}</h2>
<div>
    {#if show_editor }
    <div class="scheduler-box">
        <span class="scheduler-hn">Shedule an event at: </span><span class="scheduler-label">{maybe_event_time}</span><br>
        <span class="scheduler-label">Enter a topic:</span><input type="text" bind:value={maybe_event_topic}><br>
        <span class="scheduler-label">Enter your id:</span><input type="text"  bind:value={maybe_event_id}><br>
        <span class="scheduler-label">Enter your email:</span><input type="text"  bind:value={maybe_event_email}><br>
        <span class="scheduler-label">Enter your phone:</span><input type="text"  bind:value={maybe_event_contact_phone}><br>
        <span class="scheduler-label">by zoom: </span><input type="checkbox" bind:checked={maybe_event_zoom}>
        <span class="scheduler-label">in person: </span><input type="checkbox" bind:checked={maybe_event_in_person}><br>
        <span class="scheduler-label">for {maybe_event_how_long} minutes</span><input type="range" bind:value={maybe_event_how_long} min={maybe_event_lb} max={maybe_event_ub} step={maybe_event_step}><br>
        <button on:click={publish_event_request}>request</button>
        <button on:click={hide_editor}>close</button>
    </div>
    {/if}
    <h3> events </h3>
    <div class="day-list-holder">
        {#each all_day as hour_data}
            {#if hour_data.use === USE_AS_BLOCK }
                {#if !(hour_data.on_half_hour) }
                    <div class="hour-display blocked-hour" >
                        {hour_data.time}
                    </div>
                {/if}
            {:else}
                {#if !(hour_data.on_half_hour) }
                    <div class="hour-display {hour_data.use}" on:click={(ev) => { handle_change_request(hour_data) }} >
                        {hour_data.time}
                    </div>
                {:else}
                    <div class="half-hour-display {hour_data.use}" on:click={(ev) => { handle_change_request(hour_data) }}>
                        +30:
                    </div>
                {/if}
            {/if}
        {/each}
    </div>
</div>
</div>
<style>
    div { 
        border : solid 1px black;
    }

    h3 {
        text-align: center;
        font-style: italic;
        background-color: rgb(255, 251, 239);
    }

    .day-list-holder {
        height : 400px;
        overflow-y: scroll;
    }

    .hour-display {
        border:none;
        border-bottom: 1px solid gray;
        width:98%;
        padding:3px;
        color:rgb(82, 108, 82);
        font-size: 12px;
        font-weight: bold;
    }

    .scheduler-hn {
        font-weight: 800;
        color: rgb(39, 39, 109);
    }

    .scheduler-box {
        font-size: 80%;
    }

    .scheduler-label {
        font-weight: 700;
        color: rgb(9, 79, 9);
    }

    .half-hour-display {
        border:none;
        border-bottom: 1px solid navy;
        width:98%;
        padding:3px;
        color:rgb(109, 131, 78);
        font-size: 12px;
        font-weight: bold;
    }


    .blocked-hour { 
        background-color: darkkhaki;
        color:darkgray;
        cursor:default;
    }

    .meeting {
        background-color: rgb(230, 250, 213);
        cursor:default;
    }
    .activity {
        background-color: rgb(250, 244, 213);
        cursor:default;
    }
    .open {
        cursor: pointer
    }

</style>

