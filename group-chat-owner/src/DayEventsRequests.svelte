<script>
import {publish} from '../../common/ws-relay-app'
import cnst from '../../calendar-common/constants'
import {getTimezoneOffset} from '../../common/date_utils'
import {timestamp_db} from '../../common/timestamp_db'

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

export let day

export let monthstr
export let all_day_list
export let day_event_count = 0
export let month
export let year


export let model_how_long
export let model_general_class

export let tz_hour_shift
export let user_id

export let time_zone
export let ui_user_id


const ONE_MINUTE = (60*1000)
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

let maybe_event_code = ""

let show_editor = false
let editor_for_new = false
let editor_for_update = false
let editor_for_cancel = false


let topic_group = cnst.CALENDAR_TOPIC_GROUP

let revized_all_day_list = []
let events_in_play = {}

let tzoff = 0
let tzoof_ts = 0
let src_date = new Date(year,month,day)



function  set_ev_values(time,model_ev,ev,how_long) {
    if ( ev === undefined ) {
        return
    }
    model_ev.use = ev.use
    model_ev.end_at = ev.end_at
    model_ev.how_long = (how_long !== undefined) ? how_long : ev.how_long
    //
    model_ev.use = ev.use
    //
    model_ev.begin_at = time
    model_ev.label = ev.label
    model_ev.person_id = ev.person_id
    model_ev.email = ev.email
    model_ev.contact_phone = ev.contact_phone
    model_ev.on_zoom = ev.on_zoom
    model_ev.in_person = ev.in_person
    model_ev.user_id = ev.user_id
    model_ev.accepted = ev.accepted
    model_ev.revision_state = ev.revision_state
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

$: {
    src_date = new Date(year,month,day);  // these have been passed
    let time = src_date.getTime()
    tzoff = getTimezoneOffset(time_zone,time)
    tzoof_ts = tzoff*ONE_HOUR
}

$: if ( all_day_list !== undefined ) {
    //
    let d_date = new Date(year,month,day);
    let n = all_day_list.length
    revized_all_day_list = [].fill(0,n)
    for ( let i = 0; i < n; i++ ) {   //
        //
        let time = d_date.getTime()
        //
        revized_all_day_list[i] = Object.assign({},all_day_list[i])
        //
        let ev = timestamp_db.find_event(time - tzoof_ts)
    
        if ( ev !== false ) {
            let how_long = (ev.end_at - time + tzoof_ts)/ONE_MINUTE

            let t = time - tzoof_ts
            //
            if ( (ev.use !== USE_AS_BLOCK) && (ev.use !== USE_AS_OPEN) ) {
                events_in_play[t] = ev
            }
            //
            revized_all_day_list[i] = Object.assign({},all_day_list[i])
            let model_ev = revized_all_day_list[i]
            set_ev_values(time,model_ev,ev)
            //
            if ( ev.how_long > 30 ) {
                t += ONE_HALF_HOUR
                let time_left = (ev.how_long - 30)
                while ( (t < ev.end_at) && (i < 48) ) {
                    i++;
                    if ( i === 48 ) break;
                    time_left -= 30
                    time += ONE_HALF_HOUR
                    t += ONE_HALF_HOUR
                    d_date = new Date(time)
                    //
                    revized_all_day_list[i] = Object.assign({},all_day_list[i])
                    let model_ev = revized_all_day_list[i]
                    set_ev_values(time,model_ev,ev,(revized_all_day_list[i-1].how_long - 30))
                    //
                }
            }
        } else {
            revized_all_day_list[i].use = USE_AS_OPEN
        }
        //
        time += ONE_HALF_HOUR
        d_date = new Date(time)
	}
}



$: if ( typeof model_how_long === 'number' ) {
    maybe_event_how_long = model_how_long
}

let dropped_event = false
let changed_event = false
let updating_event = false

$: if ( changed_event && (all_day_list !== undefined) ) {
    changed_event = false
    let model_ev = revized_all_day_list[maybe_event_index]
    model_ev.changed = true
    model_ev.how_long = maybe_event_how_long
    model_ev.end_at = model_ev.begin_at + maybe_event_how_long*ONE_MINUTE
    model_ev.label = maybe_event_topic
    model_ev.person_id = maybe_event_id
    model_ev.email = maybe_event_email
    model_ev.contact_phone = maybe_event_contact_phone
    model_ev.on_zoom = maybe_event_zoom
    model_ev.in_person = maybe_event_in_person
    //
    model_ev.user_id = ui_user_id
    model_ev.accepted = false
    model_ev.month = month
    model_ev.year = year
    if ( !updating_event ) {
        model_ev.revision_state = cnst.EVENT_IN_NEGOTIATION
    }

    let total_time = maybe_event_how_long
    let ch_i = maybe_event_index
    while ( total_time > 0 ) {
        total_time -= 30
        ch_i++
        if ( total_time > 0 ) {
            let ntxt_slot = revized_all_day_list[ch_i]
            ntxt_slot.changed = true
            ntxt_slot.use = model_ev.use
            ntxt_slot.how_long = model_ev.how_long
            ntxt_slot.label = model_ev.label
            //
            ntxt_slot.person_id = model_ev.person_id
            ntxt_slot.email = model_ev.email
            ntxt_slot.contact_phone = model_ev.contact_phone
            ntxt_slot.on_zoom = model_ev.on_zoom
            ntxt_slot.in_person = model_ev.in_person
            ntxt_slot.accepted = model_ev.accepted
            ntxt_slot.revision_state = model_ev.revision_state
            //
            revized_all_day_list[ch_i] = ntxt_slot
        }
    }
    revized_all_day_list[maybe_event_index] = model_ev
    //
    //all_day_list = [].concat(revized_all_day_list)
    let ev_utc = Object.assign({},model_ev)   // tzoof_ts
    ev_utc.begin_at -= tzoof_ts
    ev_utc.end_at -= tzoof_ts
    //

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    if ( updating_event ) {
        let uid_topic = ev_utc.user_id
        ev_utc.accepted = true
        //
        publish(cnst.CALENDAR_TOPIC_GROUP,uid_topic,cnst.USER_CHAT_PATH,{  // cnst.ACCEPT_EVENT_TOPIC
                "type" : "change",
                "data" : ev_utc
            })
        setTimeout(() => {      // after svelte changes
            publish(cnst.CALENDAR_TOPIC_GROUP,consts.SUGGEST_CHANGE_EVENT_TOPIC,consts.USER_CHAT_PATH,{
                "type" : "change",
                "data" : ev_utc
            })
        },5)
    } else {
        let uid_topic = ev_utc.user_id
        ev_utc.accepted = true
        //
        publish(cnst.CALENDAR_TOPIC_GROUP,uid_topic,cnst.USER_CHAT_PATH,{  // cnst.ACCEPT_EVENT_TOPIC
                "type" : "accept",
                "data" : ev_utc
            })
        setTimeout(() => {      // after svelte changes
            publish(cnst.CALENDAR_TOPIC_GROUP,cnst.ACCEPT_EVENT_TOPIC,cnst.USER_CHAT_PATH,{
                "type" : "change",
                "data" : ev_utc
            })
        },5)
    }

    timestamp_db.add(ev_utc)
}


$: if ( dropped_event && (all_day_list !== undefined)) {
    dropped_event = false
    let model_ev = revized_all_day_list[maybe_event_index]
    model_ev.how_long = 15
    model_ev.label = ""
    model_ev.person_id = ""
    model_ev.email = ""
    model_ev.contact_phone = ""
    model_ev.on_zoom = false
    model_ev.in_person = false
    model_ev.use = USE_AS_OPEN

    let total_time = maybe_event_how_long
    let ch_i = maybe_event_index
    while ( total_time > 0 ) {
        total_time -= 30
        ch_i++
        if ( total_time > 0 ) {
            let ntxt_slot = revized_all_day_list[ch_i]
            ntxt_slot.changed = true
            ntxt_slot.use = model_ev.use
            ntxt_slot.how_long = model_ev.how_long
            ntxt_slot.label = model_ev.label
            //
            ntxt_slot.person_id = model_ev.person_id
            ntxt_slot.email = model_ev.email
            ntxt_slot.contact_phone = model_ev.contact_phone
            ntxt_slot.on_zoom = model_ev.on_zoom
            ntxt_slot.in_person = model_ev.in_person
            ntxt_slot.accepted = model_ev.accepted
            //
            ntxt_slot.use = USE_AS_OPEN
            //
            revized_all_day_list[ch_i] = ntxt_slot
        }
    }
    revized_all_day_list[maybe_event_index] = model_ev
    //all_day_list = [].concat(revized_all_day_list)
    let ev_utc = Object.assign({},model_ev)   // tzoof_ts
    ev_utc.begin_at -= tzoof_ts
    ev_utc.end_at -= tzoof_ts

    ev_utc.accepted = false
    let uid_topic = `${ev_utc.user_id}-${cnst.REQUEST_EVENT_DROP_TOPIC}`
    //
    publish(cnst.CALENDAR_TOPIC_GROUP,uid_topic,cnst.USER_CHAT_PATH,{  // cnst.ACCEPT_EVENT_TOPIC
            "type" : "drop",
            "data" : ev_utc
        })
    //
    setTimeout(() => {      // after svelte changes
        publish(cnst.CALENDAR_TOPIC_GROUP,cnst.REJECT_EVENT_TOPIC,cnst.USER_CHAT_PATH,{
            "type" : "drop",
            "data" : ev_utc
        })
    },5)

    timestamp_db.remove(ev_utc)
}

function hide_editor() {
    show_editor = false
    editor_for_new = false
    editor_for_update = false
    editor_for_cancel = false
}


function handle_change_request(hour_data) {
    //
    let real_start = hour_data
    //
    if ( hour_data.use !== USE_AS_OPEN ) {
        let ri = hour_data.index
        while ( ri > 0 ) {
            ri--
            let maybe_real = revized_all_day_list[ri]
            if ( (maybe_real.use === real_start.use) && (maybe_real.label === real_start.label) ) {
                real_start = maybe_real
            } else break
        }
    }
    //  WHO OWNS
    //
    let src_ev = events_in_play[real_start.begin_at - tzoof_ts]
    if ( src_ev === undefined ) {
        if ( real_start.use === USE_AS_OPEN ) {
            editor_for_new = true
        } else if ( (real_start.use !== USE_AS_BLOCK) && (real_start.changed) ) {  // or this is the owner....
            editor_for_update = true
        } else if ( (real_start.use !== USE_AS_BLOCK) && !(real_start.changed) ) {
            editor_for_cancel = true     // 
        }
        maybe_event_how_long = real_start.how_long
        maybe_event_index = real_start.index
        maybe_event_time = real_start.time
        maybe_event_half_hour = real_start.on_half_hour
        //
        maybe_event_topic = real_start.label
        maybe_event_id = real_start.person_id
        maybe_event_email = real_start.email
        maybe_event_contact_phone = real_start.contact_phone
        maybe_event_zoom = real_start.on_zoom
        maybe_event_in_person = real_start.in_person
    } else {
        if ( (src_ev.revision_state === cnst.EVENT_IN_NEGOTIATION) && (src_ev.user_id === ui_user_id) ) {  // or this is the owner....
            editor_for_update = true
        } else {
            editor_for_cancel = true     // 
        }

        maybe_event_how_long = src_ev.how_long
        maybe_event_index = src_ev.index
        maybe_event_time = src_ev.time
        maybe_event_half_hour = src_ev.on_half_hour
        //
        maybe_event_topic = src_ev.label
        maybe_event_id = src_ev.person_id
        maybe_event_email = src_ev.email
        maybe_event_contact_phone = src_ev.contact_phone
        maybe_event_zoom = src_ev.on_zoom
        maybe_event_in_person = src_ev.in_person
    }

    //
    show_editor = true
    //
    if ( editor_for_new ) {
        let current_ub = 0
        let i = maybe_event_index
        while ( ++i < 48 ) {
            current_ub += ONE_HALF_HOUR_MINUTES
            let nxt_slot = revized_all_day_list[i]
            if ( nxt_slot.use !== USE_AS_OPEN ) break
        }
        maybe_event_ub = current_ub
    } else if ( editor_for_update ) {       // can increase the duration of the event
        let current_ub = 0
        let i = maybe_event_index
        while ( ++i < 48 ) {
            current_ub += ONE_HALF_HOUR_MINUTES
            let nxt_slot = revized_all_day_list[i]
            if ( ( nxt_slot.use !== USE_AS_OPEN ) && ( nxt_slot.label !== maybe_event_topic ) )  break
        }
        maybe_event_ub = current_ub
    }
    //
}


function publish_event_accept(ev) {

    hide_editor()
    changed_event = true
    updating_event = false
    day_event_count++
    //
}


function publish_event_revision(ev) {
    let model_ev = all_day_list[maybe_event_index]
    model_ev.use = USE_AS_MEET
    hide_editor()

    model_ev.changed = false
    let total_time = model_ev.how_long
    let ch_i = maybe_event_index
    while ( total_time > 0 ) {
        total_time -= 30
        ch_i++
        if ( total_time > 0 ) {
            let ntxt_slot = all_day_list[ch_i]
            ntxt_slot.changed = false
            ntxt_slot.use = USE_AS_OPEN
            ntxt_slot.label = ""
        }
    }
    //
    model_ev.changed = true
    changed_event = true
    updating_event = true
    //
}


function publish_event_cancel(ev) {
    //
    hide_editor()
    //
    changed_event = false
    updating_event = false
    dropped_event = true
    day_event_count--
    // 
}



</script>
<div class="contain-all">
<h2>{monthstr}&nbsp;&nbsp;{day}</h2>
<div class="contain-controls">
    {#if show_editor }
    <div class="scheduler-box">
        <span class="scheduler-hn">Respond to event at: </span>
        <span class="scheduler-label">{maybe_event_time}</span><br>
        <!--   value fields -->
        {#if !(editor_for_cancel) } 
        <span class="scheduler-label">Enter a topic:</span><input type="text" bind:value={maybe_event_topic} placeholder="Enter a topic label"><br>
        {#if !model_general_class }
            <span class="scheduler-label">Enter your id:</span><input type="text"  bind:value={maybe_event_id}><br>
            <span class="scheduler-label">Enter your email:</span><input type="text"  bind:value={maybe_event_email}><br>
            <span class="scheduler-label">Enter your phone:</span><input type="text"  bind:value={maybe_event_contact_phone}><br>
        {/if}
        <span class="scheduler-label">by zoom: </span><input type="checkbox" bind:checked={maybe_event_zoom}>
        <span class="scheduler-label">in person: </span><input type="checkbox" bind:checked={maybe_event_in_person}><br>
        <span class="scheduler-label">for {maybe_event_how_long} minutes</span><input type="range" bind:value={maybe_event_how_long} min={maybe_event_lb} max={maybe_event_ub} step={maybe_event_step}><br>
        {:else}
        <span class="scheduler-label">Topic:</span>{maybe_event_topic}<br>
        <span class="scheduler-label">Enter your id:</span><input type="text"  bind:value={maybe_event_id}><br>
        <span class="scheduler-label">Enter your event code:</span><input type="text"  bind:value={maybe_event_code}><br>
        <span class="scheduler-label">Email:</span>{maybe_event_email}<br>
        <span class="scheduler-label">Phone:</span>{maybe_event_contact_phone}<br>
        <span class="scheduler-label">by zoom: </span><input type="checkbox" bind:checked={maybe_event_zoom} disabled />
        <span class="scheduler-label">in person: </span><input type="checkbox" bind:checked={maybe_event_in_person}  disabled /><br>
        <span class="scheduler-label">for {maybe_event_how_long} minutes</span>{maybe_event_how_long}<br>
        {/if}

        <button on:click={publish_event_accept}>accept</button>
        <button on:click={publish_event_revision}>update</button>
        <button on:click={publish_event_cancel}>drop</button>

        <button on:click={hide_editor}>cancel</button>
    </div>
    {/if}
    <h3> events </h3>
    <div class="day-list-holder">
        {#if (all_day_list !== undefined) }
            {#each revized_all_day_list as hour_data}
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
                            {#if hour_data.label.length > 0}
                                <span>{hour_data.label}</span>
                            {/if}
                            {#if hour_data.accepted > 0}
                                <span>✔️</span>
                            {/if}
                        </div>
                    {:else}
                        <div class="half-hour-display {hour_data.use}" on:click={(ev) => { handle_change_request(hour_data) }}>
                            +30:
                            {#if hour_data.label.length > 0}
                                <span>{hour_data.label}</span>
                            {/if}
                            {#if hour_data.accepted > 0}
                                <span>✔️</span>
                            {/if}
                        </div>
                    {/if}
                {/if}
            {/each}
        {/if}
    </div>
</div>
</div>
<style>
    div { 
        border : solid 1px black;
    }

    .contain-all {
        min-height: 90%;
        max-height: 90%;
        overflow: hidden;
    }

    .contain-controls {
        min-height: 100%;
        max-height: 100%;
        overflow: hidden;
    }


    h3 {
        text-align: center;
        font-style: italic;
        background-color: rgb(255, 251, 239);
    }

    .day-list-holder {
        height: calc(70vh);
        min-height : 100%;
        overflow-y: scroll;
        display:flexbox;
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
        position: absolute;
        top: 70px;
        left: 1px;
        width: calc(100% - 3px);
        z-index: 10000;
        background-color: white;
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

