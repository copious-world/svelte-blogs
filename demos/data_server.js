// data server under users     USERS
// viewing data server
//

const fs = require('fs')
const fsPromises = require('fs/promises')
const path = require('path'); 
const express = require('express');
const { generateKeyPair } = require('crypto');
const {MessageRelayer} = require("message-relay-services");
const { rejects } = require('assert');
//
const {file_watch_handler,load_directory} = require('./object_file_util');
const AppSearching = require('./application_searching.js')


class SearchesByUser {
    //
    //
    constructor(SearchClass,owner,conf) {
        this.searches = new SearchClass(conf)
        this.owner = owner
        //
        this.global_file_list = []
        this.global_file_list_by = { "create_date" : [], "update_date" : []}
        this.searches.set_global_file_list_refs(this.global_file_list,this.global_file_list_by)
        this.user_info = {}
    }


    set_user_info(info) {
        if ( info === undefined ) return
        this.user_info  = info
    }

    async run_op(op) {          // these are operations on the query...
        switch ( op.cmd ) {
            case "search" : {           // run the search
                let req = op.req
                return await this.process_search(req)
            }
            case "remove" : {           // clear this search from memory
                let req = op.req
                this.searches.clear(req.body.query)
                break
            }
            case "info" : {             // tell us about the user
                return({ "status" : "OK", "data" : JSON.stringify(this.user_info) })
            }
            case "item" : {             // retrieve a particular item....
                let item
                let req = op.req
                let key = req.body.key
                let field = req.body.field
                //
                let linear = global_file_list_by["update_date"]
                let n = linear.length
                let start = 0
                for ( let i = start; i < n; i++ ) {
                    item = linear[i]
                    if ( item ) {
                        if ( item[field] === key ) {
                            return({ "status" : "OK", "data" : JSON.stringify(item) })
                        }
                    }
                }
            }
        }
        return({ "status" : "OK" })
    }

    async process_search(req) {
        let query = req.params.query;
        let box_count = parseInt(req.params.bcount);
        let offset = parseInt(req.params.offset);
        //
        let search_results = this.searches.get_search(query,offset,box_count);
        return(search_results)
    }
    
    add_just_one(f_obj,is_new) {
        this.searches.add_just_one(f_obj,is_new)
    }
}



/// ------------------------------------  EXPRESS APP


var bodyParser = require('body-parser');
var cors = require('cors')

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// //
// setup app
const app = express()
app.use(urlencodedParser)
app.use(jsonParser)
//app.use(cors)
// ----


/// ------------------------------------  EXPRESS APP


//
const PRUNE_MINUTES = 30
const TIMEOUT_THRESHHOLD = 8*60*60     // in seconds
const TIMEOUT_THRESHHOLD_INTERVAL = (1000*60)*PRUNE_MINUTES


let g_prune_timeout = null
process.on('SIGINT',(signal) => {
    if ( g_prune_timeout !== null ) {
        clearInterval(g_prune_timeout)
    }
    process.exit(0)
})


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// // // // // 
// ---- ---- ---- ---- COMMAND LINE PARAMETERS ---- ---- ---- ---- ----
let g_port = 3000
let g_address = "localhost"
let g_update_dir = '/media/richard/ELEMENTS/data/users/records' 
let g_subdir = '/media/richard/ELEMENTS/data/users/records' 
let g_conf_file = '/media/richard/ELEMENTS/endpoint-services/user/config.json'
let g_user_assets_dir = '/media/richard/ELEMENTS/data/users/assets'
let g_conf = {
    'port' : 5114,
    'address' : 'localhost',
    'file_shunting' : false
}


//
// The plan here is to never use the defaults (except in testing) 
// So, command line processing is almost nothing. 
const PAR_COM_CONFIG = 2

const PAR_SHRINK = 3
const PAR_PORT = 4
const PAR_RECORD_DIRECTORY = 5
const PAR_UPDATE_DIRECTORY = 6
const PAR_ASSET_DIRECTORY = 7

if ( process.argv[PAR_COM_CONFIG] !== undefined ) {             // g_conf_file  --- location of communication configuration
    g_conf_file = process.argv[PAR_COM_CONFIG]
}

if ( g_conf_file !== undefined ) {
    g_conf = JSON.parse(fs.readFileSync(g_conf_file,'ascii').toString())
            // if this fails the app crashes. So, the conf has to be true JSON
}
//
// // //
g_subdir = g_conf.records_dir
g_update_dir = g_conf.updating_records_directory
g_user_assets_dir = g_conf.assets_directory
g_port = g_conf.port
g_address = g_conf.address
//
//
//
if ( process.argv[PAR_SHRINK] !== undefined ) {         // Shrink -- multiplier for search metric
    g_conf.shrinkage = parseFloat(process.argv[PAR_SHRINK])
}
if ( process.argv[PAR_PORT] !== undefined ) {           // port --- port of the service provided in this module
    g_port = parseInt(process.argv[PAR_PORT])
}
if ( process.argv[PAR_RECORD_DIRECTORY] !== undefined ) {       // g_subdir  --- location of searchable records and new data
    g_subdir = process.argv[PAR_RECORD_DIRECTORY]
}
if ( process.argv[PAR_UPDATE_DIRECTORY] !== undefined ) {       // g_update_dir  --- location of new data
    g_update_dir = process.argv[PAR_UPDATE_DIRECTORY]
    if ( g_update_dir === 'same' ) g_update_dir = g_subdir
}
if ( process.argv[PAR_ASSET_DIRECTORY] !== undefined ) {       // g_update_dir  --- location of new data
    g_user_assets_dir = process.argv[PAR_ASSET_DIRECTORY]
    if ( g_user_assets_dir === 'same' ) g_user_assets_dir = g_subdir
}



// ---- ---- ---- ---- ---- ---- ---- ---- ----
// 
const g_search_interface = new AppSearching(g_conf)        // see initialization below

let g_particular_user_searches = {
    'admin' : new SearchesByUser(AppSearching,'admin',g_conf)
}

function addCustomSearch(owner) {
    g_particular_user_searches[owner] = new SearchesByUser(AppSearching,owner,g_conf)
}

function addToCustomSearch(f_obj,is_new) {
    if ( f_obj._id ) {
        let owner = f_obj.email
        let user_search =  g_particular_user_searches[owner]
        if ( user_search === undefined ) {
            addCustomSearch(owner)
        }
        user_search =  g_particular_user_searches[owner]
        if ( user_search ) {
            user_search.add_just_one(f_obj,is_new)
        }
    }
}

async function run_custom_operation(owner,op) {
    let result = { "status" : "emtpy" } 
    try {
        let custom = g_particular_user_searches[owner]
        if ( custom ) {
            let custom = g_particular_user_searches[owner]
            result = await custom.run_op(op)
        }
    } catch(e) {}
    return result
}

async function paritcular_interface_info(item_key) {
    let custom = g_particular_user_searches[item_key]
    let op = { "cmd" : "info" } 
    result = await custom.run_op(op)
    return(result)
}


// ---- ----  ---- ---- MESSAGE RELAY....(for publishing assets)
// ---- ----  ---- ---- configure

// ---- ----  ---- ---- create communication object (talks to an endpoint server)
 // most of the user in formation coming into this service is through file watching...
 // but some information may be obtained by direct query to a user endpoint
//
// The persistence endpoint that relays files out to dashboard, profiles, and other user specific
// transitional frontend services...
//let g_message_relayer = g_conf.persistence ? new MessageRelayer(g_conf.persistence) : false

// SUBSCRIBE to the publication events destined for this service....
/*
if ( g_message_relayer && g_conf.subscribe ) {
    g_message_relayer.subscribe(g_conf.subscribe,{},(obj) => {
        // should be about a new stream entry....
        if ( obj.topic === g_conf.subscribe ) {
            if ( obj.user_only ) {
                let user_key = obj.user_only
                let searcher = g_particular_user_searches[user_key]
                //searcher.searches.addCustomSearch
                //
            }
        }
    })
}*/


// ---- ----  ---- ---- WATCH SUBDIRECTORY....
//
console.log("watchging dir " + g_update_dir)
let g_watch_for_new_files = fs.watch(g_update_dir)  // watch for files in only one specific directory...
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

// FILE CHANGE LISTENER
g_watch_for_new_files.on('change', (eventType, filename) => {
    console.log(` eventType ....  ${eventType}` )
                                                                if ( eventType === 'change' ) {
                                                                    let fname = filename.trim()
                                                                    if ( fname.substr(0,2) === '._' ) return
                                                                    asset_record_add_or_update(fname)
                                                                } else if ( eventType === 'rename' ) {
                                                                    let fname = filename.trim()
                                                                    if ( fname.substr(0,2) === '._' ) return
                                                                    asset_record_handle_remove(fname)
                                                                }
                                                            });

// ---- ---- ---- ---- ---- ---- ---- ---- ----
//
//
function asset_record_add_or_update(filename) {
    console.log(` ....  ${filename}` )
    // require this to be a json file
    if ( filename.substr(0,2) === '._' ) return
    if ( path.extname(filename) === '.json' ) {
        let fpath = g_update_dir + '/' + filename
        file_watch_handler(fpath,add_just_one_new_asset)
    }
}


function asset_record_handle_remove(filename) {
    if ( path.extname(filename) === '.json' ) {
        let fpath = g_update_dir + '/' + filename
        file_watch_handler(fpath,false,remove_just_one_asset,filename)
    }
}


async function add_just_one_new_asset(fdata) {
    if ( fdata.length > 1 ) {
        try {
            let f_obj = JSON.parse(fdata)
            g_search_interface.add_just_one(f_obj)
            let is_new = true
            addToCustomSearch(f_obj,is_new)                      /// custom search for users in memory
        } catch (e) {
            console.log(e)
        }    
    }
}


async function remove_just_one_asset(fname) {
    if ( fname.indexOf('+') > 0 ) {
        let asset_name = fname.replace('.json','')
        if( asset_name != fname ) {
            let [tracking,type,email] = fname.split('+')
            g_search_interface.remove_just_one(tracking)
        }
    }
}


// 
// when creating assets for a new user, use templates and put them in user specific directories
// 
// 


//  ----
let g_global_file_list = []
let g_global_file_list_by = {}

g_search_interface.set_global_file_list_refs(g_global_file_list,g_global_file_list_by)



function inject_user_object(u_obj) {
    g_global_file_list.push(u_obj)    
}

function after_loading() {
    g_search_interface.update_global_file_list_quotes_by()
    console.log("done loading stream entries ... ready")
}


// // 
// prune_searches
// // 
function prune_searches() {
    //
    console.log("pruning searches")
    let count = g_search_interface.prune(TIMEOUT_THRESHHOLD)
    //
    console.log(`searches pruned: ${count}`)
}




async function process_search(req) {
    let query = req.params.query;
    let box_count = parseInt(req.params.bcount);
    let offset = parseInt(req.params.offset);
    //
    let search_results = await g_search_interface.get_search(query,offset,box_count);
    return(search_results)
}


// ---- ---- ---- ---- 

function rate_limited(uid) {
    return false
}


function rate_limit_redirect(req,res) {
    return res.redirect('/')
}

// ---- ---- ---- ---- HTML APPLICATION PATHWAYS  ---- ---- ---- ---- ---- ---- ----

app.get('/',(req, res) => {
    res.end("THIS SERVER IS WORKING")
})


app.get('/:uid/:query/:bcount/:offset', async (req, res) => {

    console.dir(req.params)
    //
    let uid = req.params.uid;
    if ( rate_limited(uid) ) {
        return rate_limit_redirect(req,res)
    }
    //
    let data = await process_search(req)
    res.send(data)
})

// { uid: '12345', query: 'any', bcount: '1', offset: '1' }
//
app.post('/:uid/:query/:bcount/:offset', async (req, res) => {
    console.dir(req.params)
    
    let uid = req.params.uid;
    if ( rate_limited(uid) ) {
        return rate_limit_redirect(req,res)
    }

    let data = await process_search(req)
    res.send(data)
})


app.get('/custom/:owner/:query/:bcount/:offset', async (req, res) => {
    let owner = req.params.owner;
    if ( rate_limited(owner) ) {
        return rate_limit_redirect(req,res)
    }
    let data = []
    try {
        let custom = g_particular_user_searches[owner]
        if ( custom ) {
            data = await custom.process_search(req)
        }
    } catch (e) {
    }
    //
    //
    res.send(data)
})

// _tracking	"e9cb10ba-1bf4-4078-9561-b267cf096c72"

app.post('/custom/:op/:owner', async (req, res) => {
    let uid = req.params.owner;
    if ( rate_limited(owner) ) {
        return rate_limit_redirect(req,res)
    }
    let cmd = req.params.op
    let owner = req.params.owner
    if ( cmd === 'user-info' ) {
        let uid = req.body.uid
        let response = await paritcular_interface_info(owner,uid)  // paritcular_interface_info shall check for role access
        return response
    }
    //
    let op = {
        "cmd" : req.params.op,
        "req" : req
    }
    //
    let data = await run_custom_operation(owner,op)
    res.send(data)
})


app.get('/cycle/:halt', (req, res) => {
    let do_halt = req.params.halt
    backup_searches(do_halt)
    res.send("OK")
})

/*
*/

app.get('/reload',(req, res) => {
    load_directory(g_subdir)
    res.send("OK")
})

// ---- ---- ---- ---- RUN  ---- ---- ---- ---- ---- ---- ---- ----
// // // 
// 
load_directory(g_subdir,true,inject_user_object,after_loading)
//
//
g_search_interface.restore_searches()
//
// //
g_prune_timeout = setInterval(prune_searches,TIMEOUT_THRESHHOLD_INTERVAL)
//
//
app.listen(g_port, () => {
  console.log(`Example app listening at http://localhost:${g_port}`)
})

