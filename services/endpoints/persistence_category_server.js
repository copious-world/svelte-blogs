
const PersistenceMessageEndpoint = require("categorical-handlers/persistence.js")
//
const fs = require('fs')
const fsPromises = require('fs/promises')



function faux_random_enough() {
    let rr = Math.random()
    rr = Math.floor(rr*1897271171)
    return "dashing" + rr
}

// -- -- -- --

class TransitionsPersistenceEndpoint extends PersistenceMessageEndpoint {

    //
    constructor(conf) {
        super(conf)
        //
        this.app_subscriptions_ok = true
        // ---------------->>  topic, client_name, relayer  (when relayer is false, topics will not be written to self)
        this.add_to_topic("command-publish",'self',false)           // allow the client (front end) to use the pub/sub pathway to send state changes
        this.add_to_topic("command-recind",'self',false)
        this.add_to_topic("command-delete",'self',false)
        this.add_to_topic("command-send",'self',false)
    }
    //

    // app_subscription_handler
    //  -- Handle state changes...
    // this is the handler for the topics added directoy above in the constructor
    app_subscription_handler(topic,msg_obj) {
        //
        if ( topic === 'command-publish' ) {
            msg_obj._tx_op = 'P'
        } else if ( topic === 'command-recind' ) {
            msg_obj._tx_op = 'U'
        } else if ( topic === 'command-delete' ) {
            msg_obj._tx_op = 'D'
        }
        //
        this.app_message_handler(msg_obj)           // run the handler (often gotten to by relay to endpoint messaging ... this is pub/sub pathway)
        //
        if ( ( topic === 'command-publish' ) || ( topic === 'command-publish' ) ) {
            let op = 'F' // change one field
            let field = 'published'
            let value = msg_obj.published
            this.user_action_keyfile(op,u_obj,field,value)
        }
    }

    // ----
    make_path(u_obj) {
        let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
        let asset_info = u_obj[key_field]   // dashboard+striking@pp.com  profile+striking@pp.com
        if ( !(asset_info) ) return(false)
        if ( asset_info.indexOf('+') < 0 ) {
            console.log(`malformed file specifier in ${__filename}`)
            console.dir(u_obj)
            return(false)
        }
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
        return(user_path)
    }

    // ----
    application_data_update(u_obj,data) {
        try {
            let d_obj = JSON.parse(data)
            //
            let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
            let asset_info = u_obj[key_field]   // dashboard+striking@pp.com  profile+striking@pp.com
            if ( asset_info )  {
                asset_info = asset_info.split('+')
                let user_id = asset_info.pop()
                d_obj.owner = user_id
                d_obj.email = user_id
                d_obj.id = asset_info
                let path_key = d_obj.path_key
                if ( path_key ) {
                    d_obj[`which_${path_key}`] = faux_random_enough()  // a name for the application tab...
                } else {
                    d_obj.which_tab_name = faux_random_enough()
                }
                data = {
                    "mime_type" : "application/json",
                    "string" : JSON.stringify(d_obj)
                }
                data = JSON.stringify(data)
            }
        } catch (e) {
            return(data)
        }
        return(data)
    }

    // ----
    async user_action_keyfile(op,u_obj,field,value) {  // items coming from the editor  (change editor information and publish it back to consumers)
        switch ( op ) {
            case 'C' : {
                let key_field = u_obj.key_field ? u_obj.key_field : u_obj._transition_path
                let asset_info = u_obj[key_field]   // dashboard+striking@pp.com  profile+striking@pp.com
        
                asset_info = asset_info.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                let entry_type = asset_info.pop()
                let asset_file_base = asset_info.pop()
                //
                user_path += '/' + user_id
                //
                let entries_file = user_path + `/${asset_file_base}.json`
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                user_path += '/' + entry_type
                user_path += '/' + asset_file_base + ".json"
                //
                u_obj.file_name = user_path
                if ( entries_record.entries[entry_type] === undefined ) {
                    entries_record.entries[entry_type] = []
                }
                entries_record.entries[entry_type].push(u_obj)
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                let topic = 'user-' + asset_file_base
                this.app_publish(topic,entries_record)
                break;
            }
            case 'U' : {    // update (read asset_file_base, change, write new)
                let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
                let asset_info = u_obj[key_field]   // dashboard+striking@pp.com  profile+striking@pp.com

                asset_info = asset_info.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                let entry_type = asset_info.pop()
                let asset_file_base = asset_info.pop()
                //
                user_path += '/' + user_id
                //
                let entries_file = user_path + `/${asset_file_base}.json`
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                user_path += '/' + entry_type
                user_path += '/' + asset_file_base + ".json"
                //
                u_obj.file_name = user_path
                if ( entries_record.entries[entry_type] !== undefined ) {
                    let entry_list = entries_record.entries[entry_type]
                    for ( let i = 0; i < entry_list.length; i++ ) {
                        let entry = entry_list[i]
                        if ( entry._id == u_obj._id ) {
                            entry_list[i] = u_obj               // change the the right object == _id match
                            break;
                        }
                    }
                }
                //
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                let topic = 'user-' + asset_file_base
                this.app_publish(topic,entries_record)               // send the dashboard or profile back to DB closers to the UI client
                break;
            }
            case 'F' : {        // change one field
                let key_field = u_obj.key_field ?  u_obj.key_field : u_obj._transition_path
                let asset_info = u_obj[key_field]   // dashboard+striking@pp.com  profile+striking@pp.com
                //
                asset_info = asset_info.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                let entry_type = asset_info.pop()
                let asset_file_base = asset_info.pop()
                //
                user_path += '/' + user_id
                //
                let entries_file = user_path + `/${asset_file_base}.json`
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                user_path += '/' + entry_type
                user_path += '/' + asset_file_base + ".json"
                //
                u_obj.file_name = user_path
                if ( entries_record.entries[entry_type] !== undefined ) {
                    let entry_list = entries_record.entries[entry_type]
                    for ( let i = 0; i < entry_list.length; i++ ) {
                        let entry = entry_list[i]
                        if ( entry._id == u_obj._id ) {
                            entry[field] = value
                            break;
                        }
                    }
                }
                //
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                let topic = 'user-' + asset_file_base
                this.app_publish(topic,entries_record)               // send the dashboard or profile back to DB closers to the UI client
                break;
            }
            case 'D' : {
                break;
            }
        }
        /*
        */
    }
}





let conf_file = 'relay-service.conf'
let conf_par = process.argv[2]
if ( conf_par !== undefined ) {
    conf_file = conf_par
}

let conf = JSON.parse(fs.readFileSync(conf_file).toString())


new TransitionsPersistenceEndpoint(conf.persistence_endpoint)
