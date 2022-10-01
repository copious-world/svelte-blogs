

////  ----

function first_day_of_month(a_date) {
    // a_date should be a Date object
    let mo = a_date.getMonth()
    let year = a_date.getFullYear()

    let nd = new Date(year,mo)
    let t = nd.getTime()
    return t
}


function first_day_of_next_month(a_date) {
    // a_date should be a Date object
    let mo = a_date.getMonth()
    let year = a_date.getFullYear()

    mo = (mo + 1) % 12
    if ( mo === 0 ) year++

    let nd = new Date(year,mo)
    let t = nd.getTime()
    return t
}

function first_day_of_relative_month(a_date,mo_offset) {
    // a_date should be a Date object
    let mo = a_date.getMonth()
    let year = a_date.getFullYear()
    //
    if ( mo_offset !== 0 ) {
        let mm = mo + mo_offset
        if ( mo_offset > 0 ) {
            if ( mm > 12 ) {
                let yoffset = Math.trunc((mm - 12)/12) + 1
                year += yoffset
                mo = mm % 12
            } else {
                mo = mm
            }
        } else {
            if ( mm < 0 ) {
                mo = (mm % 12) + 12
                let yoffset = Math.trunc((mo_offset - mo)/12)
                year += yoffset
            } else {
                mo = mm
            }
        }
    }
    
    let nd = new Date(year,mo)
    let t = nd.getTime()
    return t
}



function rect_to_time_slot(found_rect,pitch) {

    let disp_offset = found_rect.unit_x
    let disp_end = found_rect.unit_width + disp_offset
    if ( disp_offset % pitch === 0 ) {
        disp_offset += 0.000005
    }
    if ( disp_end % pitch === 0 ) {
        disp_end += 0.000005
    }
    //
    let mo_start = Math.trunc(disp_offset/pitch)
    let mo_end = Math.trunc(disp_end/pitch)
    //
    let cday = new Date()
    let d1 = first_day_of_relative_month(cday,mo_start)
    let d2 =  first_day_of_relative_month(cday,mo_end)
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


function time_slot_to_rect(date1,date2,pitch) {
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


let rec0 = [400,600]
let found_rect = {
    "unit_x" : rec0[0],
    "unit_width" : rec0[1]
}

let [d1,d2] = rect_to_time_slot(found_rect,200)
console.log(d1,d2)
let d1_test = new Date(d1.getTime())
let d2_test = new Date(d2.getTime())

console.log(d1_test)
console.log(d2_test)

let rec = time_slot_to_rect(d1_test,d2_test,200)
console.log(rec0)
console.log(rec)

found_rect = {
    "unit_x" : rec[0],
    "unit_width" : rec[1]
}

let [d3,d4] = rect_to_time_slot(found_rect,200)
let d3_test = new Date(d3)
let d4_test = new Date(d4)

console.log(d3_test)
console.log(d4_test)