import {HOUR,MIN15,MIN30,ONE_MONTH,ONE_WEEK,TWENTY_FOUR,calc_days,day_is_after_clock_day,day_is_before_clock_day,day_is_clock_day,first_day_of_month,first_day_of_month_ts,first_day_of_next_month,first_day_of_next_month_ts,first_day_of_relative_month,first_day_of_relative_month_ts,hours_of,in_interval,lower_month_bounday,next_midnight,next_month_start,part_of_day,prev_midnight,same_day} from './month-utils'


const PITCH_MATCH_EPSILON = 0.000005

let local_clock_date = new Date()   // UTC time
let when_is_midnight = (next_midnight(local_clock_date) - local_clock_date.getTime())



setTimeout(() => {
    local_clock_date = new Date()
    when_is_midnight = (next_midnight(local_clock_date) - local_clock_date.getTime())
}, when_is_midnight);



export function day_is_today(a_day,year,month) {
    return day_is_clock_day(a_day,year,month,local_clock_date)
}

export function day_is_today_timezone(a_day,year,month,timezone) {
    let str = local_clock_date.toLocaleDateString('en-US', {
        timeZone: timezone,
      })
    let pmn_date = new Date(str)
    return day_is_clock_day(a_day,year,month,pmn_date)
}


// current_day == a_day.day
export function tz_day_is_today(a_day,year,month,local_date_string,time_zone) {
    //
    let tz_date_parts = local_date_string.split('/')
    let tz_day = parseInt(tz_date_parts[1])
    let dday = a_day.day

    if ( tz_day === dday ) {
        if ( day_is_today(a_day,year,month) ) {
            return true
        } else {
            return day_is_today_timezone(a_day,year,month,time_zone)
        }
    }
    return false
}



export function day_is_before_today(a_day,year,month) {
    return day_is_before_clock_day(a_day,year,month,local_clock_date)
}

export function day_is_after_today(a_day,year,month) {
    return day_is_after_clock_day(a_day,year,month,local_clock_date)
}

// calculate endpoint

export function rect_to_time_slot(found_rect,pitch) {
    //
    let disp_offset = found_rect.unit_x
    let disp_end = found_rect.unit_width + disp_offset
    if ( disp_offset % pitch === 0 ) {
        disp_offset += PITCH_MATCH_EPSILON
    }
    if ( disp_end % pitch === 0 ) {
        disp_end += PITCH_MATCH_EPSILON
    }
    //
    let mo_start = Math.trunc(disp_offset/pitch)
    let mo_end = Math.trunc(disp_end/pitch)
    //
    let cday = new Date()
    let d1 = first_day_of_relative_month(cday,mo_start)
    let d2 = first_day_of_relative_month(cday,mo_end)
    //
    let mo_of_d1 = new Date(d1)
    let mo_of_d2 = new Date(d2)

    let n_d1 = first_day_of_next_month(mo_of_d1)
    let n_d2 = first_day_of_next_month(mo_of_d2)

    // start
    let partial_mo = (disp_offset % pitch)/pitch
    let t1_partial = (n_d1 - d1)*partial_mo
    d1 += t1_partial
    // end
    partial_mo = (disp_end % pitch)/pitch
    let t2_partial = (n_d2 - d2)*partial_mo
    d2 += t2_partial
    //
    let mody_of_d1 = new Date(d1)
    let mody_of_d2 = new Date(d2)
    //
    return [mody_of_d1,mody_of_d2]
}



export function time_slot_to_rect(date1,date2,pitch) {
    //
    let ts_start = date1.getTime()
    let ts_end = date2.getTime()
    //
    let mo1_d1 = first_day_of_month(date1)
    let mo2_d1 = first_day_of_month(date2)

    let mo1_nxt_d1 = first_day_of_next_month(date1)
    let mo2_nxt_d1 = first_day_of_next_month(date2)

    let mo1_time = (mo1_nxt_d1 - mo1_d1)
    let mo2_time = (mo2_nxt_d1 - mo2_d1)
    //
    let part1 = (ts_start - mo1_d1)/mo1_time
    let part2 = (ts_end - mo2_d1)/mo2_time

    let last_mo_partail_1 = part1*pitch
    let last_mo_partail_2 = part2*pitch

    let cur_time = new Date()
    let start_time = first_day_of_month(cur_time)

    let mo_time = start_time
    let save_x = 0
    while ( mo_time < ts_start ) {
        let dmo = new Date(mo_time)
        mo_time = first_day_of_next_month(dmo)
        save_x += pitch
    }

    let rect_start = save_x + last_mo_partail_1 - pitch

    mo_time = start_time
    save_x = 0
    while ( mo_time < ts_end ) {
        let dmo = new Date(mo_time)
        mo_time = first_day_of_next_month(dmo)
        save_x += pitch
    }

    let rect_end =  save_x + last_mo_partail_2
    let rect_width = rect_end - rect_start - pitch

    return [ rect_start, rect_width  ]
}