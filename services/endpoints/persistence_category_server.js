
const PersistenceMessageEndpoint = require("categorical-handlers/persistence.js")
//
const fs = require('fs')
const fsPromises = require('fs/promises')

class TransitionsPersistenceEndpoint extends PersistenceMessageEndpoint {
    constructor(conf) {
        super(conf)
    }
    //

    make_path(u_obj) {
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
        return(user_path)
    }

    // ----
    async user_action_keyfile(op,obj) {
        switch ( op ) {
            case 'C' : {
                let tpath = obj.trans_path
                asset_info = tpath.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                user_path += '/' + user_id
                //
                let entry_type = asset_info.pop()
                user_path += '/' + entry_type
                //
                let entries_file = user_path + ".json"
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                let file = asset_info.pop()
                user_path += '/' + file + ".json"
                //
                obj.file_name = user_path
                if ( entries_record.entries[entry_type] === undefined ) {
                    entries_record.entries[entry_type] = []
                }
                entries_record.entries[entry_type].push(obj)
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                break;
            }
            case 'U' : {
                let tpath = obj.trans_path
                asset_info = tpath.split('+')
                //
                let user_path = this.user_directory
                let user_id = asset_info.pop()
                user_path += '/' + user_id
                //
                let entry_type = asset_info.pop()
                user_path += '/' + entry_type
                //
                let entries_file = user_path + ".json"
                let entries_record = await fsPromises.readFile(entries_file)
                entries_record = JSON.parse(entries_record.toString())
                //
                let file = asset_info.pop()
                user_path += '/' + file + ".json"
                //
                obj.file_name = user_path
                if ( entries_record.entries[entry_type] !== undefined ) {
                    let entry_list = entries_record.entries[entry_type]
                    for ( let i = 0; i < entry_list.length; i++ ) {
                        let entry = entry_list[i]
                        if ( entry.id == obj.id ) {
                            entry_list[i] = obj
                        }

                    }
                }
                entries_record = JSON.stringify(entries_record)
                await fsPromises.writeFile(entries_file,entries_record)
                break;
            }
            case 'D' : {
                break;
            }
        }
        /*
{
    "id" : Math.floor(Math.random()*5000),
    "published" : (Math.random()>0.667),
    'title' : `${ky}_${i}_a bunch of stuff that can be said.....`,
    'data'  : `All about ${ky}_${i}_a bunch of stuff that can be said..... if you will\on a better day something random`,
    'deleted' : false,
    'saved_ever' : true,
    'asset_type' : ky
}
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
