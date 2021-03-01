
const UserMessageEndpoint = require("categorical-handlers/users.js")
const user_dashboard_generator = require("../transitions/dashboard").generator
const user_profile_generator = require("../transitions/profile").generator


const fs = require('fs')

let conf_file = 'relay-service.conf'
let conf_par = process.argv[2]
if ( conf_par !== undefined ) {
    conf_file = conf_par
}

let conf = JSON.parse(fs.readFileSync(conf_file).toString())

conf.user_endpoint._gen_targets = {
    "profile" : user_profile_generator,
    "dashboard" : user_dashboard_generator,
    "extension" : ".json"
}

new UserMessageEndpoint(conf.user_endpoint)
