

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

