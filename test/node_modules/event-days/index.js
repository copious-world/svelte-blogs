(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.EventDays = {}));
})(this, (function (exports) { 'use strict';

    /*!
     * calendar.js: inspired by the calendar module from Python
     * Copyright(c) 2011 Luciano Ramalho <luciano@ramalho.org>
     * MIT Licensed
     */

    class CalendarException {
        constructor(message) {
            this.message = message;
            this.toString = () => {
                return "CalendarException: " + this.message;
            };
        }
    }
    class Calendar {
        static JAN = 0;
        static FEB = 1;
        static MAR = 2;
        static APR = 3;
        static MAY = 4;
        static JUN = 5;
        static JUL = 6;
        static AUG = 7;
        static SEP = 8;
        static OCT = 9;
        static NOV = 10;
        static DEC = 11;

        constructor(firstWeekDay) {
            this.firstWeekDay = firstWeekDay || 0;
        }
        weekStartDate(date) {
            let startDate = new Date(date.getTime());
            while (startDate.getDay() !== this.firstWeekDay) {
                startDate.setDate(startDate.getDate() - 1);
            }
            return startDate;
        }
        monthDates(year, month, dayFormatter, weekFormatter) {
            if ((typeof year !== "number") || (year < 1970)) {
                throw new CalendarException('year must be a number >= 1970');
            }
            if ((typeof month !== "number") || (month < 0) || (month > 11)) {
                throw new CalendarException('month must be a number (Jan is 0)');
            }
            let weeks = new Array();
            let date = this.weekStartDate(new Date(year, month, 1));
            let count = 0;
            do {
                let week = new Array();
                for (let i = 0; (i < 7); i++) {
                    let rslt = (dayFormatter ? dayFormatter(date, count++) : date);
                    week.push(rslt);
                    date = new Date(date.getTime());
                    date.setDate(date.getDate() + 1);
                }
                weeks.push(weekFormatter ? weekFormatter(week) : week);
            } while ((date.getMonth() <= month) && (date.getFullYear() === year));
            return weeks;
        }
        monthDays(year, month) {
            let getDayOrZero = (date) => {
                return date.getMonth() === month ? date.getDate() : 0;
            };
            return this.monthDates(year, month, getDayOrZero);
        }
        monthMap(year, month, InfoClass) {
            let getDayOrFalse = (date, count) => {
                return (date.getMonth() === month) ? `${date.getDate()},${count}` : false;
            };
            let month_table = this.monthDates(year, month, getDayOrFalse);
            let mlist = month_table.flat();
            let the_map = false;
            if (InfoClass !== undefined) {
                the_map = {};
                for (let day of mlist) {
                    if (day !== false) {
                        let ds = day.toString();
                        the_map[ds] = new InfoClass(...((ds.split(',').map(dd => parseInt(dd)))));
                    }
                }
            }
            let month_map = {
                "table": month_table,
                "list": mlist,
                "map": the_map
            };
            return month_map;
        }
        monthText(year, month) {
            if (typeof year === "undefined") {
                let now = new Date();
                year = now.getFullYear();
                month = now.getMonth();
            }
            let getDayOrBlank = (date) => {
                let s = date.getMonth() === month ? date.getDate().toString() : "  ";
                while (s.length < 2)
                    s = " " + s;
                return s;
            };
            let weeks = this.monthDates(year, month, getDayOrBlank, (week) => { return week.join(" "); });
            return weeks.join("\n");
        }
    }

    //
    function hours_of(lapse) {
        let hrs = ((lapse/1000)/3600);
        return hrs
    }

    //
    function calc_days(t_time) {
        let days = Math.trunc((t_time/1000)/3600/24);
        return days
    }

    //
    function same_day(t1,t2) {
        return (new Date(t1).getDate() === (new Date(t2).getDate()))
    }

    //
    function first_day_of_month(a_date) {
        // a_date should be a Date object
        let mo = a_date.getMonth();
        let year = a_date.getFullYear();

        let nd = new Date(year,mo);
        let t = nd.getTime();
        return t
    }


    function first_day_of_next_month(a_date) {
        // a_date should be a Date object
        let mo = a_date.getMonth();
        let year = a_date.getFullYear();

        mo = (mo + 1) % 12;
        if ( mo === 0 ) year++;

        let nd = new Date(year,mo);
        let t = nd.getTime();
        return t
    }


    function lower_month_bounday(a_time) {
        let arg_date = new Date(a_time);
        return first_day_of_month(arg_date)
    }

    function next_month_start(a_time) {
        let arg_date = new Date(a_time);
        return first_day_of_next_month(arg_date)
    }

    //
    function in_interval(instant,t_start,t_end) {
        //console.log("in_interval",instant,t_start,t_end)
        if ( (t_start <= instant) && (instant <= t_end) ) return true
        return false
    }

    // ---- TimeSlotAgenda ---- ---- ---- ---- ---- ---- ----
    class TimeSlotAgenda {

        //
        constructor(day,index) {
            this.day = day;
            this.index = index;
            this.start_time = -Infinity;
            this.end_time = Infinity;
            this.all_day = {};
        }

        // set_start_and_end
        set_start_and_end(st,et) {
            this.start_time = st;
            this.end_time = et;
        }

        // ---- add_slot
        // returns a conflict if found (false otherwise)... 
        add_slot(a_slot) {
            if ( !a_slot ) return false
            //
            let conflicts = [];
            //
            let ba = a_slot.begin_at; 
            let ea = a_slot.end_at; 

            for ( let sky in this.all_day ) {
                let slot = this.all_day[sky];
                if ( in_interval(slot.begin_at, ba,ea) || in_interval(slot.end_at, ba,ea) ) {
                    conflicts.push(slot);
                } else if ( in_interval(ba,slot.begin_at,slot.end_at) || in_interval(ea,slot.begin_at, slot.end_at) ) {
                    conflicts.push(slot);
                }
            }
            //
            if ( conflicts.length ) return conflicts
            else {
                this.all_day[a_slot.begin_at] = a_slot;
            }
            return false
        }


        // ---- find_slot 
        find_slot(start_time) {
            let slot = this.all_day[start_time];
            if ( slot ) return slot
            for ( let sky in this.all_day ) {
                let slot = this.all_day[sky];
                if ( in_interval(start_time,slot.begin_at,slot.end_at)  ) return slot
            }
            return false
        }

        // ---- remove_slot
        remove_slot(a_slot) {
            if ( !a_slot ) return
            let st = a_slot.begin_at;
            if ( this.all_day[st] ) {
                delete this.all_day[st];
            }
        }


        // ---- add_all_slots
        add_all_slots(slot_list) {
            let conflicts = [];
            for ( let a_slot of slot_list ) {
                if ( a_slot ) {
                    let conflict = this.add_slot(a_slot);
                    if ( conflict ) {
                        conflicts.push(...conflict);
                    }    
                }
            }
            if ( conflicts.length ) return conflicts
            return false
        }

    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


    const g_cal = new Calendar(0);

    const TWENTY_FOUR$1 = (24*3600*1000);


    // ---- overlap
    function overlap(a_month,a_slot) {
        if ( (a_slot.end_time < a_month.start_time) || (a_month.end_time < a_slot.start_time) ) {
            return false
        }
        if ( (a_slot.start_time < a_month.start_time) && (a_slot.end_time < a_month.end_time) ) {
            return 1
        } else if ( a_month.start_time < a_slot.start_time ) {
            if ( a_month.end_time <= a_slot.end_time ) {
                return 2
            }
            return 3  // contained
        } else if ( (a_month.start_time >= a_slot.start_time) && (a_month.end_time <= a_slot.end_time) ) {
            return 4  // month is contained  ... condition check not stricly necessary
        }
        return false
    }


    // ---- MonthContainer
    class MonthContainer {

        // ----
        constructor(start_time,AgendaClass) {
            if ( Array.isArray(start_time) ) {
                this.date = new Date(...start_time);
            } else {
                this.date = new Date(start_time);
            }
            this.start_time = first_day_of_month(this.date);
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();
            if ( isNaN(this.year) || isNaN(this.month) ) throw "Nan for year or month in MontainContainer constructor"
            //
            this.agenda_maker = (AgendaClass !== undefined) ? AgendaClass : TimeSlotAgenda;
            if ( (AgendaClass !== undefined) && !(AgendaClass.prototype instanceof TimeSlotAgenda) ) {
                this.agenda_maker = TimeSlotAgenda;
            }
            //
            this.cal = g_cal.monthMap(this.year, this.month, this.agenda_maker);
            this.init_slot_times();
            this.end_time = this.last_day_time();
        }

        init_slot_times() {
            let st = this.start_time;
            let access_tsa = this.cal.map;
            let tsa_keys = Object.keys(access_tsa);
            tsa_keys.sort();
            for ( let key of tsa_keys ) {
                let tsa = access_tsa[key];
                if ( tsa ) {
                    tsa.set_start_and_end(st,st + TWENTY_FOUR$1-1);
                }
                st += TWENTY_FOUR$1;
            }
        }

        last_day_time()  {
            let lday_tsa = this.last_day();
            return lday_tsa ? lday_tsa.end_time : Infinity
        }


        last_day() {
            let d_list = this.cal.list;
            if ( d_list ) {
                let idx = d_list.lastIndexOf(false);
                if ( (idx === -1) || (idx < 7) ) idx = d_list.length - 1;
                let lday_ky = false;
                while ( lday_ky === false ) {
                    idx--;
                    lday_ky = d_list[idx];
                }
                
                d_list[idx-1];
                let lday = this.cal.map[lday_ky];
                return lday
            }
            return false
        }

        day_of(a_time) {
            let lapse = a_time - this.start_time;
            return calc_days(lapse)
        }

        get_day_agenda(indx) {
            let da_ky = this.map.list[indx];
            if ( da_ky ) {
                let tsa = this.cal.map[da_ky];
                return tsa
            }
            return false
        }

        add_agenda_list(day_agenda) {   // for deserializing
            if ( day_agenda === undefined ) return false
            let idx = day_agenda.index;
            let ts_agenda_ky = this.cal.list[idx];
            if ( ts_agenda_ky ) {
                let tsa = this.cal.map[ts_agenda_ky];
                if ( tsa === undefined ) {
                    tsa = new this.agenda_maker(day_agenda.day,idx);
                    this.cal.map[ts_agenda_ky] = tsa;
                }
                //
                let conflicts = tsa.add_all_slots(day_agenda.slots);
                if ( conflicts ) return conflicts
            }
            return false
        }

        add_time_slot(a_t_slot) {
            let ovl = overlap(this,a_t_slot);
            if ( ovl !== false ) {
                //
                let slots = false;
                //
                switch (ovl) {
                    case 1: {
                        slots = a_t_slot.get_range(this.start_time,a_t_slot.end_time);
                        break; 
                    }
                    case 2: {
                        slots = a_t_slot.each_day;
                        break;
                    }
                    case 3:  {
                        slots = a_t_slot.get_range(a_t_slot.start_time,a_t_slot.end_time);
                        break;
                    }
                    case 4:   {
                        slots = a_t_slot.get_range(this.start_time,this.end_time);
                        break;
                    }
                }
                //
                if ( slots && slots.length ) {
                    let conflicts = [];
                    let a_slot = slots[0];
                    if ( a_slot ) {
                        let mo_i = this.day_of(a_slot.begin_at);
                        a_slot = slots[slots.length - 1];
                        let mo_end = this.day_of(a_slot.end_at);
                        while ( mo_i < mo_end ) {
                            let ts_agenda_ky = this.cal.list[mo_i];
                            let ts_agenda = this.cal.map[ts_agenda_ky];
                            if ( ts_agenda ) {
                                let slot_conflicts = ts_agenda.add_slot(a_slot);
                                if ( slot_conflicts ) {
                                    conflicts = conflicts.push(...slot_conflicts);
                                }    
                            }
                            mo_i++;
                        }    
                    }
                    //
                    if ( conflicts.length ) return conflicts
                }
                return true
            }
            return false
        }


        remove_time_slot(start_time) {
            let day = this.day_of(start_time);
            let da_ky = this.cal.list[day];
            if ( da_ky ) {
                let tsa = this.cal.map[da_ky];
                if ( tsa ) {
                    let a_slot = tsa.find_slot(start_time);
                    tsa.remove_slot(a_slot);
                }    
            }
        }

        remove_all_of_time_slot(a_t_slot) {
            let month_set = a_t_slot.get_range(this.start_time,this.end_time);
            for ( let a_slot of month_set ) {
                this.remove_time_slot(a_slot.begin_at);
            }
        }

    }

    // a list of month containers ... managed sliding window relative to a DB
    // Time line has the conflicts publication...

    const DEFAULT_MAX_WINDOW = 100;

    class TimeLine {
        // 
        constructor(conf,AgendaClass) {
            //
            this.in_app_month_store = {};  // all the months that have been fetched or injested
            this.month_start_time_window = []; // the window of time that have been fetched or we want fetched
            //
            this.agenda_maker = AgendaClass;   /// let the month container sort it out
            //
            this.all_events_labels_to_time = {
                "example" : [0,false]  // start_time, slot data structure 
            };
            //
            this.month_fetcher = conf.fetcher;
            if ( (conf.fetcher === undefined) || typeof this.month_fetcher.get !== 'function' ) {
                this.month_fetcher = false;
            }
            //
            if ( typeof conf.time_line_fetcher === 'function' ) {
                let t_fetch = conf.time_line_fetcher;
                let self = this;
                setTimeout(async () => {
                    let t_data = await t_fetch();
                    if ( t_data ) {
                        self.all_events_labels_to_time = t_data.label_to_time;
                    }
                },0);
            }
            this.time_line_sender = false;
            if ( typeof conf.time_line_sender === 'function' ) {
                this.time_line_sender = conf.time_line_sender;
            }
            //
            this.month_sender = conf.send_and_store;
            //
            this.window_size = conf.window_size ? conf.window_size :  DEFAULT_MAX_WINDOW;
            this.conflict_publisher = conf.conflict_publisher;
        }


        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        // send_month
        send_month(start_time) {
            let st = lower_month_bounday(start_time);
            let mo = this.in_app_month_store[st];
            if ( this.month_sender ) {
                this.month_sender(mo);
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        // publish_conflicts
        publish_conflicts(conflicts) {
            if ( typeof this.conflict_publisher === 'function' ) {
                try {
                    this.conflict_publisher(conflicts);
                } catch(e) {
                    console.log(e);
                }
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

        // filter_existing_times
        #filter_existing_times(st_list) {
            let remaining = [];
            for ( let st of st_list ) {
                if ( this.in_app_month_store[st] === undefined ) {
                    remaining.push(st);
                }
            }
            return remaining
        }

        //
        // adjacent_start_times
        missing_adjacent_start_times(start_time) {
            let adj_list = [];
            //
            if ( start_time < this.month_start_time_window[0] ) {
                let first_starter = this.month_start_time_window[0];
                adj_list.push(start_time);
                while ( start_time < first_starter ) {
                    start_time = next_month_start(start_time);
                    adj_list.push(start_time);
                }
            } else if ( start_time > this.month_start_time_window[this.month_start_time_window.length -1] ) {
                let first_starter = this.month_start_time_window[this.month_start_time_window.length -1];
                while ( start_time > first_starter ) {
                    first_starter = next_month_start(first_starter);
                    adj_list.push(first_starter);
                }
            }
            
            adj_list = this.#filter_existing_times(adj_list);
            return adj_list
        }


        // trim_to_window
        #trim_to_window(start_time) {   // mostly about trimming the time list (age out the map)
            let nm = this.month_start_time_window.length;
            if ( nm < this.window_size ) return
            else {
                //
                let no2 = Math.floor(nm/2);
                let st = this.month_start_time_window[no2];
                if ( st > start_time ) {
                    let delta = (nm - this.window_size);
                    this.month_start_time_window.splice(0,delta);
                } else {
                    let delta = (nm - this.window_size);
                    let start = this.window_size;
                    this.month_start_time_window.splice(start,delta);
                }
                //
            }
        }

        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        //
        // injest_month
        async injest_month(start_time) {
            //
            if ( !(this.month_fetcher) ) return
            //
            if ( this.in_app_month_store[start_time] === undefined ) {
                //
                start_time = lower_month_bounday(start_time);
                //
                let window_based_list = this.missing_adjacent_start_times(start_time);  // return missing months as a list
                if ( window_based_list.length ) {
                    let month_data = await this.month_fetcher.get(window_based_list);
                    if ( month_data ) {
                        for ( let mo_moment in month_data ) {
                            //
                            let i_mo_moment = parseInt(mo_moment);
                            let moc = new MonthContainer(i_mo_moment,this.agenda_maker);
                            this.in_app_month_store[mo_moment] = moc;   /// only place the missing ones
                            this.month_start_time_window.push(i_mo_moment);
                            //
                            let mo = month_data[mo_moment];  // the data from the fetcher service (whatever that is)
                            let conflicts = moc.add_agenda_list(mo.agenda);
                            //
                            if ( conflicts && conflicts.length ) {
                                this.publish_conflicts(conflicts);
                            }
                        }
                        this.month_start_time_window.sort();
                        this.#trim_to_window(start_time);
                    }
                }
            }
        }

        async scroll_right(n) {
            let st = 0;
            if ( this.month_start_time_window.length === 0) {
                st = lower_month_bounday(Date.now());
            } else {
                st = this.month_start_time_window[this.month_start_time_window.length - 1];
            }
            while ( n-- ) {
                st = next_month_start(st);
            }
            await this.injest_month(st);
        }

        async scroll_left(n) {
            let st = 0;
            if ( this.month_start_time_window.length === 0 ) {
                st = lower_month_bounday(Date.now());
            } else {
                st = this.month_start_time_window[0];
            }
            while ( n-- ) {
                st -= 3600*24;  // go back a day
                st = lower_month_bounday(st);
            }
            await this.injest_month(st);
        }

        // remove_slot_from_store ---- local slot removal 
        remove_slot_from_store(a_t_slot) {  // 
            let st = a_t_slot.start_time;
            let et = a_t_slot.end_time;

            st = lower_month_bounday(st);
            et = next_month_start(et);
            while ( st < et ) {
                let mo = this.in_app_month_store[st];
                if ( mo ) {
                    mo.remove_all_of_time_slot(a_t_slot);
                }
                st = next_month_start(st);    
            }
        }

        remove_slot_everywhere(label) {
            if ( this.all_events_labels_to_time ) {
                let slot_data = this.all_events_labels_to_time[label];
                delete this.all_events_labels_to_time[label];
                //
                let a_t_slot = slot_data[1];
                if ( a_t_slot ) {
                    this.remove_slot_from_store(a_t_slot);
                    if ( this.time_line_sender ) {
                        // send the new time line, send the slot that is being removed from server side 
                        // stored months
                        this.time_line_sender(this.all_events_labels_to_time,a_t_slot);
                    }
                }
            }
        }

        save_time_list(do_send_months) {
            if ( this.time_line_sender ) {
                // send the new time line, state specifically that no slot is being removed...
                this.time_line_sender(this.all_events_labels_to_time,false);
            }
            if ( do_send_months ) {
                for ( let st of this.month_start_time_window ) {
                    this.send_month(st);
                }
            }
        }

    }

    const TWENTY_FOUR = 24*3600*1000;


    class Slot {

        constructor(label,begin_t,end_t) {
            this.begin_at = begin_t ? begin_t : 0;
            this.end_at = end_t ? end_t : 0;
            this.label = label;
        }

        adjust_start(lapse) {     // may be negative
            this.begin_at += lapse;
        }

        adjust_end(lapse) {     // may be negative
            this.end_at += lapse;
        }

    }


    class TimeSlot {

        static USE_AS_BLOCK = "block"
        static USE_AS_MEET = "meeting"
        static USE_AS_ACTIVITY = "activity"
        static USE_AS_OPEN = "open"

        constructor(label,use_case,start_time,end_time,break_apart,importance,weekends,daily_dur,filler,SlotClass) {
            this.start_time = start_time;    // may be months apart
            this.end_time = end_time;
            this.break_apart = break_apart;
            this.importance = importance;
            this.weekends = weekends;
            this.use_case = use_case;
            this.daily_duration = daily_dur ? daily_dur : ((same_day(start_time,end_time)) ? (end_time - start_time) : 0);
            this.label = label;
            this.each_day = [];   /// constructed finally in init...
            //
            this.slot_maker = ( SlotClass !== undefined ) ? SlotClass : Slot;
            if ( ( SlotClass !== undefined ) && !(SlotClass.prototype instanceof Slot) ) {
                this.slot_maker = Slot;
            }
            //
            this.init(filler);
        }

        init(filler) {
            this.lapse = (this.end_time - this.start_time);
            this.lapse_sec  = (this.lapse)/1000;
            this.lapse_hr = this.lapse_sec/3600;
            this.lapse_days = this.lapse_hr/24;
            this.lapse_mo = this.lapse_days/30; /// this approximate
            //
            if ( (filler === undefined) || (filler === false) ) {
                this.each_day = [];
                for ( let i = 0; i < this.lapse_days; i++ ) {
                    this.each_day.push(new this.slot_maker(this.label));
                }
            } else {
                this.each_day = Array.from(Array(this.lapse_days),filler);
                this.#trim_slots();
                this.#filter_slots();
                this.#sort_slots();
            }

            this.set_beginnings();
            this.set_endings();
        }

        #trim_slots() {
            while ( this.each_day[0] === false ) this.each_day.shift();
            if ( this.each_day.length ) {
                while ( this.each_day[this.each_day.length - 1] === false ) this.each_day.pop();
            }
        }

        #filter_slots() {
            this.each_day = this.each_day.filter((a_slot) => a_slot);
        }

        #sort_slots() {
            this.each_day.sort((a,b) => { return  (b && a) ? (b.start_at - a.start_at) : (a ? -1 : 1)  }); 
        }

        split(start_of_split,end_of_split) {
            if ( ( this.start_time <= start_of_split ) && (this.end_time >= end_of_split) ) {
                let s_day_index = calc_days(start_of_split - this.start_time);
                let e_day_index = calc_days(this.end_time - end_of_split) + 1;
                for ( let i = s_day_index; i < e_day_index; i++ ) {
                    let a_slot = this.each_day[i];
                    if ( a_slot ) {
                        if ( (a_slot.begin_at < start_of_split) && (hours_of((start_of_split - a_slot.begin_at)) < 24) ) {
                            a_slot.adjust_start(start_of_split -  a_slot.begin_at);
                            this.start_time = a_slot.begin_at;
                        } else if ( a_slot.end_at > end_of_split && (hours_of((a_slot.end_at - end_of_split)) < 24) ) {
                            a_slot.adjust_end(end_of_split -  a_slot.end_at);
                            this.end_time = a_slot.end_at;
                        } else {
                            this.each_day[i] = false;  // remove the event
                        }
                    }
                }
            }

            let first_start_time = false;
            let first_end_time = false;
            //
            let second_start_time = false;
            let second_end_time = false;

            let part_1 = [];
            let part_2 = [];

            for ( let a_day of this.each_day ) {
                if ( a_day && (first_start_time === false) ) {
                    first_start_time = a_day.begin_at;
                    part_1.push(a_day);
                } else if ( a_day && (first_end_time === false) ) {
                    first_end_time = a_day.end_at;
                    part_1.push(a_day);
                } else if ( a_day && (second_start_time === false)  ) {
                    second_start_time = a_day.begin_at;
                    part_2.push(a_day);
                } else if ( a_day && (second_end_time === false)  ) {
                    second_end_time = a_day.end_at;
                    part_2.push(a_day);
                }
            }

            let early = false;
            let later = false;

            if ( first_end_time ) {
                let start_time = first_start_time;
                let end_time = first_end_time;
                let use_case = this.use_case;
                let break_apart = this.break_apart;
                let importance = this.importance;
                let weekends = this.weekends;
                let label = this.label;
                early = new TimeSlot(label,use_case,start_time,end_time,break_apart,importance,weekends);
                let n = early.each_day.length;
                for ( let i = 0; i < n; i++ ) {
                    early.each_day[i] = part_1.shift();
                }

            }

            if ( second_start_time ) {
                let start_time = second_start_time;
                let end_time = second_end_time;
                let break_apart = this.break_apart;
                let importance = this.importance;
                let weekends = this.weekends;
                let label = this.label;
                later = new TimeSlot(label,use_case,start_time,end_time,break_apart,importance,weekends);
                for ( let i = 0; i < n; i++ ) {
                    later.each_day[i] = part_2.shift();
                }
            }

            if ( early ) early.#filter_slots();
            if ( later ) later.#filter_slots();

            return [early,later]
        }


        grow_sooner_days(num_days) {
            let first_day = this.each_day[0];
            for ( let i = 0; i < num_days; i++ ) {
                let a_slot = new this.slot_maker(this.label,first_day.begin_at,first_day.end_at);
                this.each_day.unshift(a_slot);
            }
            this.#sort_slots();
        }

        grow_later_days(num_days) {
            let last_day = this.each_day[this.each_day.length-1];
            for ( let i = 0; i < num_days; i++ ) {
                let a_slot = new this.slot_maker(this.label,last_day.begin_at,last_day.end_at);
                a_slot.begin_at = last_day.begin_at;
                a_slot.end_at = last_day.end_at;
                this.each_day.push(a_slot);
            }
            this.#sort_slots();
        }

        set_beginnings() { // a time from Date calculation
            let day_start = this.start_time;
            for ( let a_slot of this.each_day ) {
                if ( a_slot ) a_slot.begin_at = day_start;
                day_start += TWENTY_FOUR;
            }
        }

        set_endings() {  // a time is seconds into the day
            this.each_day.forEach((a_slot) => {
                if ( a_slot ) a_slot.end_at = a_slot.begin_at + this.daily_duration;
            });
        }

        shift_slots(delta) {
            this.each_day.forEach((a_slot) => {
                if ( a_slot ) {
                    a_slot.begin_at += delta;
                    a_slot.end_at += delta;
                }
            });        
        }

        drop_by_pattern(pat_fun) {
            this.each_day = this.each_day.filter((a_slot) => { return pat_fun(a_slot) });
        }

        set_one_begining(index,a_time) {
            let a_slot = this.each_day[index];
            if ( a_slot ) {
                a_slot.begin_at = a_time;
            }
        }

        set_one_ending(index,a_time) {
            let a_slot = this.each_day[index];
            if ( a_slot ) {
                a_slot.end_at = a_time;
            }
        }

        #merge_first(first_t_slot,second_t_slot) {
            let between_time = (second_t_slot.start_time-first_t_slot.end_time);
            if ( between_time > 0 ) {
                let days_between = calc_days(second_t_slot.start_time - first_t_slot.end_time);
                first_t_slot.grow_later_days(days_between);
                for ( let a_slot of second_t_slot.each_day ) {
                    first_t_slot.each_day.push(a_slot);
                }
            } else {
                let days_overlap = calc_days(second_t_slot.start_time - first_t_slot.end_time);
                if ( second_t_slot.lapse_days > days_overlap ) {
                    let day_1 = (second_t_slot.lapse_days - days_overlap);
                    while ( day_1 < second_t_slot.lapse_days ) {
                        let a_slot = second_t_slot.each_day[day_1++];
                        first_t_slot.each_day.push(a_slot);
                    }
                }
            }
        }

        merge_with(a_time_slot) {
            if ( a_time_slot.start_time < this.start_time ) {
                this.#merge_first(a_time_slot,this);
            } else {
                this.#merge_first(this,a_time_slot);
            }
        }

        merge_with_overlap(a_time_slot) {
            this.each_day = this.each_day.concat(a_time_slot.each_day);
            this.#sort_slots();
        }


        get_range(start_time,end_time) {
            if ( (start_time >= this.start_time) && (end_time <= this.end_time) ) {
                let day_offset = calc_days(start_time - this.start_time);
                let e_day_offset = (this.lapse_days - calc_days(this.end_time - end_time)) + 1;
                let slots = this.each_day.slice(day_offset,e_day_offset);
                return slots
            }
            return []
        }

    }

    let EventDays = {
        TimeLine,
        TimeSlotAgenda,
        MonthContainer,
        TimeSlot,
        Slot
    };

    exports.EventDays = EventDays;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
