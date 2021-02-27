
const UserMessageEndpoint = require("categorical-handlers/users.js")


const fs = require('fs')

let conf_file = 'relay-service.conf'
let conf_par = process.argv[2]
if ( conf_par !== undefined ) {
    conf_file = conf_par
}

let conf = JSON.parse(fs.readFileSync(conf_file).toString())

new UserMessageEndpoint(conf.user_endpoint)
