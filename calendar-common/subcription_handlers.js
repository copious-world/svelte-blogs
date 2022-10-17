import {publish} from '../common/ws-relay-app'
import cnst from './constants'
import {EventDays} from './event-days'


class MonthFetcher {
    //
    constructor(list_from_editor) {
        this.source_month_map = {}
        for ( let mo of list_from_editor ) {
            source_month_map[mo.start_time] = mo
        }
    }

    get(month_list) {
        let result = {}
        for ( let moky of month_list ) {
            result[moky] = this.source_month_map[moky]
        }
        return result   
    }
    //
}

// list_on_display -- this is actually using the thing list... it has the current edits. 
//

export async function send_time_line(list_of_time_slots,list_on_display) {
    let TimeLine = EventDays.TimeLine
    //
    let tl = new TimeLine({
        "send_and_store" : (a_month) => {
            window.post_month(a_month)
        },
        "month" : new MonthFetcher(list_on_display)
    })
    //
    for ( let mo of list_on_display ) {
        for ( let ts of list_of_time_slots ) {
            mo.add_time_slot(ts)
        }
        tl.injest_month(mo.start_time)
    }
    //
    let status = await tl.save_time_list(true)   // has to negotiate with of-this.world
    if ( status ) {
        let message = {
            "notification" : "change",
            "affective" : Date.now()
        }
        publish(cnst.NOTIFY_TIMELINE_CHANGE,cnst.USER_CHAT_PATH,message)
    }
}



export async function injest_request(req,things) {
    for ( let a_thing of things ) {
        let slot = req.data
        if ( (a_thing.month === slot.month) && (a_thing.year === slot.year) ) {
            //
            let tlsa = a_thing.cal.map[slot.mo_key]
            if ( tlsa ) {
                let conflicts = tlsa.add_slot(req)
                if ( conflicts ) {
                    // slot was no added...
                }
            }
            //
            return true
        }
    }
    return false
}

export default {
    send_time_line,
    injest_request
}