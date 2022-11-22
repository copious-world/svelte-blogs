const evuses = require('./event-uses') 
// 
// https://www.federalpay.org/holidays/json/2030
// ---- ---- ---- ---- ---- ---- ---- ----

function getDefaultOffDays2(year,chck_day) {
    var date = new Date(year, 0, 1);
    while (date.getDay() != chck_day) {
      date.setDate(date.getDate() + 1);
    }
    var days = [];
    while (date.getFullYear() == year) {
      var m = date.getMonth() + 1;
      var d = date.getDate();
      days.push(`${m}/${d}/${year}`);
      date.setDate(date.getDate() + 7);
    }
    return days;
}


//
let local_midnights = {}   // UTC midnight by local time (stored for this stite)

let y_start = 2022
for ( let y = 0; y < 4; y++ ) {
    for ( let i = 0; i < 12; i++ ) {
        mnight_ky = `${i+1}/1/${y_start}`
        local_midnights[mnight_ky] = new Date(y_start,i,1).getTime()
        //
        let nxt_mo = (i < 11) ? new Date(y_start,i+1,1) :  new Date((y_start+1),1,1)
        let t = nxt_mo.getTime()
        t -= evuses.ONE_HOUR*24
        let da = new Date(t)
        let day = da.getDate()
        mnight_ky = `${i+1}/${day}/${y_start}`
        local_midnights[mnight_ky] = new Date(y_start,i,day).getTime()
    }
    y_start++
}


let sundays_2022 = getDefaultOffDays2(2022,0)
let sundays_2023 = getDefaultOffDays2(2023,0)
let sundays_2024 = getDefaultOffDays2(2024,0)
let sundays = [].concat(sundays_2022,sundays_2023,sundays_2024)



let saturdays_2022 = getDefaultOffDays2(2022,6)
let saturdays_2023 = getDefaultOffDays2(2023,6)
let saturdays_2024 = getDefaultOffDays2(2024,6)
let saturdays = [].concat(saturdays_2022,saturdays_2023,saturdays_2024)


let holidays_2022 = [{"name":"New Year's Day","date":"December 31, 2021"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 17, 2022"},{"name":"Washington's Birthday","date":"February 21, 2022"},{"name":"Memorial Day","date":"May 30, 2022"},{"name":"Juneteenth Independence Day","date":"June 20, 2022"},{"name":"Independence Day","date":"July 4, 2022"},{"name":"Labor Day","date":"September 5, 2022"},{"name":"Columbus Day","date":"October 10, 2022"},{"name":"Veterans Day","date":"November 11, 2022"},{"name":"Thanksgiving Day","date":"November 24, 2022"},{"name":"Christmas Day","date":"December 26, 2022"}]
let holidays_2023 = [{"name":"New Year's Day","date":"January 2, 2023"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 16, 2023"},{"name":"Washington's Birthday","date":"February 20, 2023"},{"name":"Memorial Day","date":"May 29, 2023"},{"name":"Juneteenth Independence Day","date":"June 19, 2023"},{"name":"Independence Day","date":"July 4, 2023"},{"name":"Labor Day","date":"September 4, 2023"},{"name":"Columbus Day","date":"October 9, 2023"},{"name":"Veterans Day","date":"November 10, 2023"},{"name":"Thanksgiving Day","date":"November 23, 2023"},{"name":"Christmas Day","date":"December 25, 2023"}]
let holidays_2024 = [{"name":"New Year's Day","date":"January 1, 2024"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 15, 2024"},{"name":"Washington's Birthday","date":"February 19, 2024"},{"name":"Memorial Day","date":"May 27, 2024"},{"name":"Juneteenth Independence Day","date":"June 19, 2024"},{"name":"Independence Day","date":"July 4, 2024"},{"name":"Labor Day","date":"September 2, 2024"},{"name":"Columbus Day","date":"October 14, 2024"},{"name":"Veterans Day","date":"November 11, 2024"},{"name":"Thanksgiving Day","date":"November 28, 2024"},{"name":"Christmas Day","date":"December 25, 2024"}]
let holidays_2025 = [{"name":"New Year's Day","date":"January 1, 2025"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 20, 2025"},{"name":"Washington's Birthday","date":"February 17, 2025"},{"name":"Memorial Day","date":"May 26, 2025"},{"name":"Juneteenth Independence Day","date":"June 19, 2025"},{"name":"Independence Day","date":"July 4, 2025"},{"name":"Labor Day","date":"September 1, 2025"},{"name":"Columbus Day","date":"October 13, 2025"},{"name":"Veterans Day","date":"November 11, 2025"},{"name":"Thanksgiving Day","date":"November 27, 2025"},{"name":"Christmas Day","date":"December 25, 2025"}]
let holidays_2026 = [{"name":"New Year's Day","date":"January 1, 2026"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 19, 2026"},{"name":"Washington's Birthday","date":"February 16, 2026"},{"name":"Memorial Day","date":"May 25, 2026"},{"name":"Juneteenth Independence Day","date":"June 19, 2026"},{"name":"Independence Day","date":"July 3, 2026"},{"name":"Labor Day","date":"September 7, 2026"},{"name":"Columbus Day","date":"October 12, 2026"},{"name":"Veterans Day","date":"November 11, 2026"},{"name":"Thanksgiving Day","date":"November 26, 2026"},{"name":"Christmas Day","date":"December 25, 2026"}]
let holidays_2027 = [{"name":"New Year's Day","date":"January 1, 2027"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 18, 2027"},{"name":"Washington's Birthday","date":"February 15, 2027"},{"name":"Memorial Day","date":"May 31, 2027"},{"name":"Juneteenth Independence Day","date":"June 18, 2027"},{"name":"Independence Day","date":"July 5, 2027"},{"name":"Labor Day","date":"September 6, 2027"},{"name":"Columbus Day","date":"October 11, 2027"},{"name":"Veterans Day","date":"November 11, 2027"},{"name":"Thanksgiving Day","date":"November 25, 2027"},{"name":"Christmas Day","date":"December 24, 2027"}]
let holidays_2028 = [{"name":"New Year's Day","date":"December 31, 2027"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 17, 2028"},{"name":"Washington's Birthday","date":"February 21, 2028"},{"name":"Memorial Day","date":"May 29, 2028"},{"name":"Juneteenth Independence Day","date":"June 19, 2028"},{"name":"Independence Day","date":"July 4, 2028"},{"name":"Labor Day","date":"September 4, 2028"},{"name":"Columbus Day","date":"October 9, 2028"},{"name":"Veterans Day","date":"November 10, 2028"},{"name":"Thanksgiving Day","date":"November 23, 2028"},{"name":"Christmas Day","date":"December 25, 2028"}]
let holidays_2029 = [{"name":"New Year's Day","date":"January 1, 2029"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 15, 2029"},{"name":"Washington's Birthday","date":"February 19, 2029"},{"name":"Memorial Day","date":"May 28, 2029"},{"name":"Juneteenth Independence Day","date":"June 19, 2029"},{"name":"Independence Day","date":"July 4, 2029"},{"name":"Labor Day","date":"September 3, 2029"},{"name":"Columbus Day","date":"October 8, 2029"},{"name":"Veterans Day","date":"November 12, 2029"},{"name":"Thanksgiving Day","date":"November 22, 2029"},{"name":"Christmas Day","date":"December 25, 2029"}]
let holidays_2030 = [{"name":"New Year's Day","date":"January 1, 2030"},{"name":"Birthday of Martin Luther King, Jr.","date":"January 21, 2030"},{"name":"Washington's Birthday","date":"February 18, 2030"},{"name":"Memorial Day","date":"May 27, 2030"},{"name":"Juneteenth Independence Day","date":"June 19, 2030"},{"name":"Independence Day","date":"July 4, 2030"},{"name":"Labor Day","date":"September 2, 2030"},{"name":"Columbus Day","date":"October 14, 2030"},{"name":"Veterans Day","date":"November 11, 2030"},{"name":"Thanksgiving Day","date":"November 28, 2030"},{"name":"Christmas Day","date":"December 25, 2030"}]

let all_src_holidays = [].concat(holidays_2022,holidays_2023,holidays_2024,holidays_2025,holidays_2026,holidays_2027,
    holidays_2028,holidays_2029,holidays_2030)


let holiday_list = {}

for ( let hdef of all_src_holidays ) {
    let da = new Date(hdef.date)
    let t = da.getTime()

    let entry = {
        "label" : hdef.name,
        "date_key" : da.toLocaleDateString(),
        "begin_at" : t,
        "end_at"   : t + (24*evuses.ONE_HOUR),
        "use" : evuses.USE_AS_BLOCK
    }

    holiday_list[entry.date_key] = entry
}



let p = JSON.stringify(local_midnights,false,2)

let sunday_map = {}
for ( let sunday of sundays ) {
    sunday_map[sunday] = new Date(sunday).getTime()
}

let saturday_map = {}
for ( let saturday of saturdays ) {
    saturday_map[saturday] = new Date(saturday).getTime()
}
//
let sundays_str = JSON.stringify(sunday_map,null,2)
let saturdays_str = JSON.stringify(saturday_map,null,2)

let holiday_list_str = JSON.stringify(holiday_list,null,2)

let output = 
`
import evuses from './event-uses'

export let time_zone = 'America/Los Angeles'

export let local_midnights = ${p} // UTC midnight by local time (stored for this stite)
//
export let sundays = ${sundays_str}
export let saturdays = ${saturdays_str}

export let holidays = ${holiday_list_str}
//


export let presets = {
    "daily" : [
        {
            "label" :  "daily-am",
            "begin_at" : 0,
            "end_at"   : 10,
            "use" : evuses.USE_AS_BLOCK
        },
        {
            "label" :  "daily-pm",
            "begin_at" : 18,
            "end_at"   : 24,
            "use" : evuses.USE_AS_BLOCK
        }
    ],
    "saturday" : [
        {
            "label" :  "saturday-am",
            "begin_at" : 0,
            "end_at"   : 15,
            "use" : evuses.USE_AS_BLOCK
        },
        {
            "label" :  "saturday-am",
            "begin_at" : 18,
            "end_at"   : 24,
            "use" : evuses.USE_AS_BLOCK
        }
    ],
    "sunday" : [
        {
            "begin_at" : 0,
            "end_at"   : 24,
            "use" : evuses.USE_AS_BLOCK
        }
    ],

    "holiday" :  [
        {
            "begin_at" : 0,
            "end_at"   : 24,
            "use" : evuses.USE_AS_BLOCK
        }
    ],

    "specials" : []
}

//
export default {
    "time_zone" : time_zone,
    "local_midnights" : local_midnights,
    "sundays" : sundays,
    "saturdays" : saturdays,
    "holidays" : holidays,
    "presets" : presets
}

`


console.log(output)
