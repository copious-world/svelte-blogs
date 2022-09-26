

let local_clock_date = new Date()

export function day_is_today(a_day,year,month) {
    let lc_year = local_clock_date.getFullYear()
    let lc_month = local_clock_date.getMonth()
    let lc_day = local_clock_date.getDate()
    if ( lc_year !== year ) return false
    if ( lc_month !== month ) return false
    if ( lc_day !== a_day.day ) return false
    return true
}


export function day_is_before_today(a_day,year,month) {
    let lc_year = local_clock_date.getFullYear()
    let lc_month = local_clock_date.getMonth()
    let lc_day = local_clock_date.getDate()
    //
    let day_date = new Date(lc_year,lc_month,lc_day)
    //
    let c_time = day_date.getTime()

    let b_date = new Date(year,month,a_day)
    let b_time = b_date.getTime()

    if ( b_time < c_time ) {
        return true
    }

    return false
}


export function first_day_of_month(a_date) {
    // a_date should be a Date object
    let mo = a_date.getMonth()
    let year = a_date.getFullYear()

    let nd = new Date(year,mo)
    let t = nd.getTime()
    return t
}


export function first_day_of_next_month(a_date) {
    // a_date should be a Date object
    let mo = a_date.getMonth()
    let year = a_date.getFullYear()

    mo = (mo + 1) % 12
    if ( mo === 0 ) year++

    let nd = new Date(year,mo)
    let t = nd.getTime()
    return t
}

export function first_day_of_relative_month(a_date,mo_offset) {
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

