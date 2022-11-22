
const QUARTER_HOUR = (60*1000*15);
const ONE_MINUTE = (60*1000)

function bin_search_nearest(v,list) {
    let n = list.length
    let i = 0;
    let j = n-1;
    while ( i < j ) {
        let lb = list[i]
        let ub = list[j]
        if ( v === lb ) return [v,v]
        if ( v === ub ) return [v,v]
        let k = i + Math.trunc((j-i)/2)
        if ( k === i ) return[lb,ub]
        let tst = list[k]
        if ( tst === v ) return [v,v]
        if ( v > tst ) {
            i = k
        } else {
            j = k
        }
    }

    let lb = list[i]
    let ub = list[j]
    return[lb,ub]
}


class tsDB {
    constructor() {
        this._all_events = {}
        this._time_stamp_keys = []
    }

    // ---- ev_obj
    add(ev_obj) {
        if ( ev_obj.begin_at ) {
            let beg = parseInt(ev_obj.begin_at)
            this._all_events[beg] = ev_obj
            this._time_stamp_keys = Object.keys(this._all_events)
            this._time_stamp_keys = this._time_stamp_keys.map(k => parseInt(k))
            this._time_stamp_keys.sort()  
        }
    }

    remove(ev_obj) {
        if ( ev_obj.start_time ) {
            delete this._all_events[ev_obj.begin_at]
            this._time_stamp_keys = Object.keys(this._all_events)
            this._time_stamp_keys = this._time_stamp_keys.map(k => parseInt(k))
            this._time_stamp_keys.sort()  
        }
    }

    find_event(time_stamp) {
        let ev = this._all_events[time_stamp]
        if ( ev ) return(ev)
        //
        let [l,u] = bin_search_nearest(time_stamp,this._time_stamp_keys)
        ev = this._all_events[l]
        if ( !(ev) ) {
            ev = this._all_events[u]
        }
        //
        if ( ev ) {
            if (  (time_stamp >= ev.begin_at) && (time_stamp < (ev.begin_at + ev.how_long*ONE_MINUTE)) ) {
                return ev
            }
        }
        //
        return false
    }

    event_in_bucket(start_time,end_time,ev_obj) {
        if ( (this._time_stamp_keys.length > 0) && start_time && end_time ) {
            let st = Math.max(this._time_stamp_keys[0],start_time)
            let et = Math.min(this._time_stamp_keys[this._time_stamp_keys.length -1],end_time)
            let find_time = ev_obj.begin_at
            if ( (find_time >= st) && (find_time <= et) && (st <= et)) {
                let bi = this._time_stamp_keys.indexOf(find_time)
                if ( bi >= 0 ) return true
            }
        }
        return false
    }

    range_has_events(start_time,end_time,chck_use) {
        if ( typeof chck_use !== 'function' ) return false
        if ( start_time < end_time ) {
            for ( let ts of this._time_stamp_keys ) {
                if ( ts >= start_time && ts <= end_time ) {
                    if ( chck_use(this._all_events[ts]) ) return true
                }
                if ( ts > end_time ) break
            }
        }
        return false
    }

}


export let timestamp_db = new tsDB()





