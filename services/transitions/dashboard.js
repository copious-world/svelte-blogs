const crypto = require('crypto')


function occlude(password) {
    let pass_extended = password + "dashboard"
    const hash = crypto.createHash('sha256');
    hash.update(pass_extended);
    let ehash = hash.digest('hex');
    return(ehash)
}

/*
{
    "user_name" : "",
    "header_user_name" : "",
    "date" : "",
    "tag_line" : "",
    "panel_key" : "",
    "dashboard_text" : "",
    "entries" : {}



    let test = {
    "name":"pixy girl",
    "email":"wixy@pp.com",
    "password":"4786e2683160cec065cf9702a92ab1d5889801954bbe0c5df44ba2ebf93da4c1",
    "action":"register",
    "form_key":"register",
    "_id":"wixy@pp.com",
    "user_op":"create",
    "m_path":"user",
    "_tstamp":1614505571642,
    "m_type":"persistence",
    "op":"S",
    "_response_id":13,
    "dir_paths":{"base":"/user-assets/wixy@pp.com","profile":"/wixy@pp.com/profile.html","dashboard":"/wixy@pp.com/dashboard.html"}}

}
*/

function storage_string_from_object(obj,path_key) {
    let date = (new Date()).toISOString()
    let dash_obj = {
        "user_name" : obj._email,
        "header_user_name" : obj.name,
        "date" : date,
        "dates" : {
            "created" : Date.now(),
            "updated" : Date.now()
        },
        "tag_line" : "<button id='dashboard-tagline-maker' onclick='make_dashoard_tagline(event)'>add tag line</button>",
        "panel_key" : occlude(obj.password),
        "path_key" : path_key,  /// should be "dashboard"
        "dashboard_text" : "<button id='dashboard-text-maker' onclick='make_dashoard_text(event)'>add text</button>",
        "entries" : {}
    }
    let str = JSON.stringify(dash_obj)
    return(str)
}


module.exports.generator = storage_string_from_object