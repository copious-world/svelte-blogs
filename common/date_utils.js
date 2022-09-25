

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