
const PersistenceMessageEndpoint = require("categorical-handlers/persistence.js")
//
const fs = require('fs')

class TransitionsPersistenceEndpoint extends PersistenceMessageEndpoint {
    constructor(conf) {
        super(conf)
    }
    //

    make_path(u_obj) {
console.dir(u_obj)
        if ( u_obj.param ) {
console.dir(u_obj.param)
            let key_field = u_obj.param.key_field
            let asset_info = u_obj.param[key_field]   // dashboard+striking@pp.com
            asset_info = asset_info.split('+')
            let user_path = this.user_directory
            let user_id = asset_info.pop()
            //
            user_path += '/' + user_id
            let entry_type = asset_info.pop()
            user_path += '/' + entry_type
            //
            if ( asset_info.length ) {
                let file = asset_info.pop()
                user_path += '/' + file + ".json"
            } else {
                user_path += ".json"
            }
console.log(user_path)
            //
            return(user_path)
        } else {
            let entry_type = u_obj.asset_type
            let user_id = u_obj._id
            let user_path = this.user_directory + '/' + user_id + '/'
            user_path += entry_type + '/' + u_obj[u_obj.key_field] + ".json"
            return(user_path)    
        }
    }
}


let conf_file = 'relay-service.conf'
let conf_par = process.argv[2]
if ( conf_par !== undefined ) {
    conf_file = conf_par
}

let conf = JSON.parse(fs.readFileSync(conf_file).toString())


new TransitionsPersistenceEndpoint(conf.persistence_endpoint)
