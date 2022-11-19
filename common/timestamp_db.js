


class tsDB {
    constructor() {
        this._all_events = {}
        this._time_stamp_keys = []
    }

    // ---- ev_obj
    add(ev_obj) {
        if ( ev_obj.begin_at ) {
            this._all_events[ev_obj.begin_at] = ev_obj
            this._time_stamp_keys = Object.keys(this._all_events)
            this._time_stamp_keys.sort()  
        }
    }

    remove(ev_obj) {
        if ( ev_obj.start_time ) {
            delete this._all_events[ev_obj.begin_at]
            this._time_stamp_keys = Object.keys(this._all_events)
            this._time_stamp_keys.sort()  
        }
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





