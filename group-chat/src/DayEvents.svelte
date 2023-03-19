<script>


// The idea here is that every event that can be added is a chat line. 
// So, events are not restricted to a start time based on scheduling... It just has a time of entry.

export let day
export let monthstr
export let all_day_list // this has become a template for showing the list of times midnight to midnight and an indicator of change
                        // this indicates that initialization has occured as well
export let day_event_count = 0
export let month
export let year

export let event_starts
export let tz_hour_shift
export let user_id
export let time_zone
export let ui_user_id

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

import {publish} from '../../common/ws-relay-app'
import cnst from '../../calendar-common/constants'
import {getTimezoneOffset} from '../../common/date_utils'
import {timestamp_db} from '../../common/timestamp_db'

const ONE_MINUTE = (60*1000)
const ONE_HOUR = (3600*1000)
const ONE_HALF_HOUR = (3600*500)
const ONE_QUARTER_HOUR = (3600*250)
const ONE_QUARTER_HOUR_MINUTES = (15)
const ONE_HALF_HOUR_MINUTES  = (30)

const USE_AS_BLOCK = "block"
const USE_AS_MEET = "meeting"
const USE_AS_OPEN = "open"


let maybe_event_time = "none scheduled"
let maybe_event_comments = ""
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
let editor_for_new = true
let editor_for_update = false
let editor_for_cancel = false


let dropped_event = false
let changed_event = false
let updating_event = false


let revized_all_day_list = []
let events_in_play = {}

let tzoff = 0
let tzoof_ts = 0
let src_date = new Date(year,month,day)


function set_ev_values(time,model_ev,ev,how_long) {
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
    model_ev.comments = ev.comments
    model_ev.person_id = ev.person_id
    model_ev.accepted = ev.accepted
    model_ev.revision_state = ev.revision_state
}


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


$: if ( changed_event && (all_day_list !== undefined) ) {
    changed_event = false
    let model_ev = revized_all_day_list[maybe_event_index]
    model_ev.changed = true
    model_ev.how_long = maybe_event_how_long
    model_ev.end_at = model_ev.begin_at + maybe_event_how_long*ONE_MINUTE
    model_ev.comments.push([time,maybe_event_comments])
    model_ev.person_id = maybe_event_id
    //
    model_ev.user_id = ui_user_id
    model_ev.month = month
    model_ev.year = year

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
            ntxt_slot.comments = model_ev.comments
            ntxt_slot.accepted = model_ev.accepted
            //
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
    // The event is always updating... always send just what was added by one instance of the client
    if ( updating_event ) {
        ev_utc.comments = [comments[comments.length-1]]     // just send the comments added here
    }
    //
    publish(cnst.CALENDAR_TOPIC_GROUP,cnst.REQUEST_EVENT_CHANGE_TOPIC,cnst.USER_CHAT_PATH,{
            "type" : "request-change",  // before accepted
            "data" : ev_utc
        })

    timestamp_db.add(ev_utc)
}


$: if ( dropped_event && (all_day_list !== undefined)) {
    dropped_event = false
    let model_ev = revized_all_day_list[maybe_event_index]
    model_ev.how_long = 15
    model_ev.comments = []
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
            ntxt_slot.comments = model_ev.comments
            //
            ntxt_slot.person_id = model_ev.person_id
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

    //
    publish(cnst.CALENDAR_TOPIC_GROUP,cnst.REQUEST_EVENT_DROP_TOPIC,cnst.USER_CHAT_PATH,{
        "type" : "request-change",  // before accepted
        "data" : ev_utc
    })

    timestamp_db.remove(ev_utc)
}

function hide_editor() {
    show_editor = false
    editor_for_new = false
    editor_for_update = false
    editor_for_cancel = false
}


function show_chat_lines(hour_data) {
    //
    let real_start = hour_data
    //
    if ( hour_data.use !== USE_AS_OPEN ) {   // theoretically the only open bucket contains the current time...
        let ri = hour_data.index
        while ( ri > 0 ) {
            ri--
            let maybe_real = revized_all_day_list[ri]
            if ( (maybe_real.use === real_start.use) && (maybe_real.comments === real_start.comments) ) {
                real_start = maybe_real
            } else break
        }
    }
    //  Chat buckets ... add a new one if it is not yet there.. 
    //
    let src_ev = events_in_play[real_start.begin_at - tzoof_ts]
    if ( src_ev === undefined ) {
        editor_for_new = true
        maybe_event_how_long = real_start.how_long
        maybe_event_index = real_start.index
        maybe_event_time = real_start.time
        maybe_event_half_hour = real_start.on_half_hour
        maybe_event_id = real_start.person_id
        maybe_event_comments = ""
        maybe_event_comments_list = []
    } else {
        editor_for_update = true
        maybe_event_how_long = src_ev.how_long
        maybe_event_index = src_ev.index
        maybe_event_time = src_ev.time
        maybe_event_half_hour = src_ev.on_half_hour
        maybe_event_id = src_ev.person_id
        maybe_event_comments = ""
        maybe_event_comments_list = real_start.comments
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
    } else if ( editor_for_update ) {       // view only... 
        let current_ub = 0
        let i = maybe_event_index
        while ( ++i < 48 ) {
            current_ub += ONE_HALF_HOUR_MINUTES
            let nxt_slot = revized_all_day_list[i]
            if ( nxt_slot.use !== USE_AS_OPEN  )  break
        }
        maybe_event_ub = current_ub
    }
    //
}



function publish_chat_line(ev) {
    // let ev_data = revized_all_day_list[maybe_event_index]
    // ev_data.use = USE_AS_MEET -- don't change the use for the chat....

   // hide_editor()  -- hide the editor when the user wants to ... they can keep adding lines
    changed_event = true    /// REACTIVE
    updating_event = false
    day_event_count++
    //

}



</script>
<div class="contain-all">
<h2>{monthstr}&nbsp;&nbsp;{day}</h2>
<div class="contain-controls">
    {#if show_editor }
    <div class="scheduler-box">
        <span class="scheduler-hn">Enter a comment: </span>
        <div class="info-entry" contenteditable="true" bind:textContent={maybe_event_comments} >
        </div>
        <span class="scheduler-label">{maybe_event_time}</span><br>
        <!--   value fields -->
        <span class="scheduler-label">{ui_user_id}</span><br>
        <!--   value fields -->
        <button on:click={publish_chat_line}>Add comment</button>
        <button on:click={hide_editor}>close</button>
    </div>
    {/if}
    <h3> events </h3>
    <div class="day-list-holder">
        {#if (all_day_list !== undefined) }
            {#each revized_all_day_list as hour_data}
                {#if !(hour_data.on_half_hour) }
                    <div class="hour-display {hour_data.use}" on:click={(ev) => { show_chat_lines(hour_data) }} >
                        {hour_data.time}
                        {#if hour_data.comments.length > 0}
                            <span>✔️</span>
                            <span>{hour_data.comments.map((cmt) => {return cmt[1]}).join('|').substring(0,12)}</span>
                        {/if}
                    </div>
                {:else}
                    <div class="half-hour-display {hour_data.use}" on:click={(ev) => { show_chat_lines(hour_data) }}>
                        +30:
                        {#if hour_data.comments.length > 0}
                            <span>✔️</span>
                            <span>{hour_data.comments.map((cmt) => {return cmt[1]}).join('|').substring(0,12)}</span>
                        {/if}
                    </div>
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

    .info-entry {
		background-color: ghostwhite;
		padding: 6px;
		border: 1px solid darkslateblue;
		min-height: 200px;
		max-height: 30%;
		overflow: scroll;
	}


</style>

