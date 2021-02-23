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

const {file_watch_handler,load_directory} = require('./object_file_util');
const { promises } = require('dns');


// //
// setup app
const app = express()
// ----


// Entry into searches that are cached
let g_local_active_searches = {}

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


// USER INFORMATION
const g_public_viewable_user_fields = ['picture', 'bio', 'name', 'key-words']
var g_currently_loaded_users = {}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// // // // // 
// ---- ---- ---- ---- COMMAND LINE PARAMETERS ---- ---- ---- ---- ----
let port = 3000
let shrink = 3.2
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
const PAR_SHRINK = 2
const PAR_PORT = 3
const PAR_RECORD_DIRECTORY = 4
const PAR_UPDATE_DIRECTORY = 5
const PAR_ASSET_DIRECTORY = 6
const PAR_COM_CONFIG = 7
//
if ( process.argv[PAR_SHRINK] !== undefined ) {         // Shrink -- multiplier for search metric
    shrink = parseFloat(process.argv[PAR_SHRINK])
}
if ( process.argv[PAR_PORT] !== undefined ) {           // port --- port of the service provided in this module
    port = parseInt(process.argv[PAR_PORT])
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
if ( process.argv[PAR_COM_CONFIG] !== undefined ) {             // g_conf_file  --- location of communication configuration
    g_conf_file = process.argv[PAR_COM_CONFIG]
}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// 

const SCORE_SHRINKAGE_FACTOR = shrink


// ---- ----  ---- ---- MESSAGE RELAY....(for publishing assets)
// ---- ----  ---- ---- configure

if ( g_conf_file !== undefined ) {
    g_conf = JSON.parse(fs.readFileSync(g_conf_file,'ascii').toString())
            // if this fails the app crashes. So, the conf has to be true JSON
}

// ---- ----  ---- ---- create communication object (talks to an endpoint server)
let g_message_relayer = new MessageRelayer(g_conf)


async function publish_static(user_obj) {
    //
    try {
        let topic = 'user-profile'
        let profile_obj = Object.assign({},user_obj)
        let fpath = g_user_assets_dir + user_obj.dir_paths.profile
        profile_obj.profile = (await fsPromises.readFile(fpath)).toString()
        profile_obj.profile = encodeURIComponent(profile_obj.profile)
        let result = await g_message_relayer.publish(topic,profile_obj)
        console.log(result)
        //
        topic = 'user-dashboard'
        let dash_obj = Object.assign({},user_obj)
        fpath = g_user_assets_dir + user_obj.dir_paths.dashboard
        dash_obj.dashboard = (await fsPromises.readFile(fpath)).toString()
        dash_obj.dashboard = encodeURIComponent(dash_obj.dashboard)
        result = await g_message_relayer.publish(topic,dash_obj)
        console.log(result)
        //
    } catch(e) {
        console.error(e)
    }
   //
}

// ---- ----  ---- ---- WATCH SUBDIRECTORY....
//
console.log("watchging dir " + g_update_dir)
let g_watch_for_new_files = fs.watch(g_update_dir)  // watch for files in only one specific directory...
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

// FILE CHANGE LISTENER
g_watch_for_new_files.on('change', (eventType, filename) => {
                                                                user_record_add_or_update(filename)
                                                            });

// ---- ---- ---- ---- ---- ---- ---- ---- ----
// 



//
function user_record_add_or_update(filename) {
    // require this to be a json file
    if ( path.extname(filename) === '.json' ) {
        let fpath = g_update_dir + '/' + filename
        file_watch_handler(fpath,add_just_one_new_user)
    }
}

//
function public_view_user(f_obj) {
    let pub_view = {}
    for ( let ky in f_obj ) {
        if ( ky in g_public_viewable_user_fields ) {
            pub_view[ky] = f_obj[ky]
        }
    }
    return pub_view
}


async function add_just_one_new_user(fdata) {
    try {
        let f_obj = JSON.parse(fdata)
        let user_dir = f_obj.dir_paths
        //
        if ( user_dir ) {
            publish_static(f_obj)
        }
        //
        let searchable = public_view_user(f_obj)
        //
        g_global_file_list.push(searchable)
        f_obj.entry = g_global_file_list.length
        f_obj.score = 1.0
        g_global_file_list_by["create_date"].push(searchable)
        g_global_file_list_by["update_date"].push(searchable)
        g_currently_loaded_users[f_obj.uid] = f_obj
    } catch (e) {
        console.log(e)
    }
}


async function user_get(uid) {
    //
    let user = g_currently_loaded_users[uid]
    if ( user ) {
        return public_view_user(user)
    }
    //
    let user_record = await g_message_relayer.remote_fetch_message(uid)
    add_just_one_new_user(user_record)
    user = g_currently_loaded_users[uid]
    return public_view_user(f_obj)
}




// 
// when creating assets for a new user, use templates and put them in user specific directories
// 
// 


//  ----
let g_global_file_list = []
let g_global_file_list_by = {}

function inject_user_object(u_obj) {
    g_global_file_list.push(u_obj)    
}

function after_loading() {

    let c_results = sort_by_created(g_global_file_list)
    let u_results = sort_by_updated(g_global_file_list)
    //
    g_global_file_list_by["create_date"] = c_results.map((item,index)=> {
        item.entry = index + 1
        item.score = 1.0
        return(item)
    })
    //
    g_global_file_list_by["update_date"] = u_results.map((item,index)=> {
        item.entry = index + 1
        item.score = 1.0
        return(item)
    })
    //
    console.log("done loading blog entries ... ready")
}


function from_all_files(orderby) {
    if ( orderby in g_global_file_list_by ) {
        return g_global_file_list_by[orderby]
    }
    return g_global_file_list_by["create_date"]
}


function sort_by_updated(results) {
    results = results.sort((a,b) => {
        if ( b.dates && a.dates ) {
            if ( b.dates.updated && a.dates.updated ) {
                return(b.dates.updated - a.dates.updated)
            }
        }
        return 0
    })
    return results
}


function sort_by_created(results) {
    results = results.sort((a,b) => {
        if ( b.dates && a.dates ) {
            if ( b.dates.created && a.dates.created ) {
                return(b.dates.created - a.dates.created)
            }
        }
        return 0
    })
    return results
}


function sort_by_score(results) {
    results = results.sort((a,b) => {
        return(b.score - a.score)
    })
    return results
}

//  ----  SEARCHING

class QueryResult {

    constructor(query,restore) {
        if ( restore === undefined ) {
            let [data,normalized_query] = run_query_stat(query)
            this.stored_data = data
            this.query = normalized_query
            this.when = Date.now()
        } else {
            this.stored_data = restore.stored_data
            this.query = restore.query
            this.when = Date.now()
        }
    }
    //
    access(offset,box_count) {
        this.when = Date.now()
        //
        let n = this.stored_data.length
        offset = Math.min(n,offset)

        let returned_data = this.stored_data.slice(offset,offset + box_count)
        let count = this.stored_data.length

        return {
            "data" : returned_data,  // the current small bucket set of data to fit the user view
            "length" : returned_data.length,
            "offset" : offset,
            "count" : count         // number of possible results to view
        }
    }
}



// ----
function backup_searches(do_halt) {

    console.log("backing up searches")
    let output = JSON.stringify(g_local_active_searches)
    fs.writeFile('./backup_searched.json',output,'ascii',(err) => {
        if ( err ) {
            console.log(err)
        }
        console.log("done ... backing up searches" + do_halt)
        if ( do_halt == true ) {
            console.log("halting ... backing up searches")
            process.exit(0)
        }
    })
}


function restore_searches() {
    console.log("restoring searches")
    try {
        let searchbkp = fs.readFileSync('./backup_searched.json','ascii').toString()

        g_local_active_searches = {}

        let stored_obj = JSON.parse(searchbkp)    
        for ( let k in stored_obj ) {
            let restored = stored_obj[k]
            let q = new QueryResult('',restored)
            g_local_active_searches[k] = q
        }

    } catch (e) {
        console.log(e)
    }
}


const SCORE_THRESHOLD = 0.5

function count_occurances(check_txt,term) {
    let cnt = 0
    let cumm_index = 0
    let n = Math.max(check_txt.length,1)

    let i = 0
    while ( (i = check_txt.indexOf(term,i)) >= 0 ) {
        i++
        cnt++
        cumm_index +=(n - i)
    }

    return([cnt,cumm_index/n])
}

function score_match(check_txt,q_list,mult) {
    let score = 0
    let index_score = 0
    
    q_list.forEach(term => {
        let [cnt,iscr] = count_occurances(check_txt,term)
        score += cnt
        index_score += iscr
    })

    score = (score + index_score)/Math.max(q_list.length,1)
    //console.log(`score: ${score}`)
    return(score*mult)
}

function good_match(f_obj,match_text) {

    let q_list = match_text.split(' ')

    let score = 0.0

    let check_txt = f_obj.title
    score += score_match(check_txt,q_list,3)
    check_txt = f_obj.subject
    score += score_match(check_txt,q_list,4)
    check_txt = f_obj.keys.join(' ')
    score += score_match(check_txt,q_list,3)
    check_txt = f_obj.txt_full
    score += score_match(check_txt,q_list,1)

    let final_score = score/SCORE_SHRINKAGE_FACTOR

    f_obj.score = final_score

    return(final_score > SCORE_THRESHOLD)
}


function run_query_stat(query_desr_str) {

    let orderby = 'create_date'
    let match_text = 'any'

    try {
        let qparts = query_desr_str.split("|")
        match_text = decodeURIComponent(qparts[0])
        orderby = qparts[1]
    } catch (e) {
        console.log(e)
        return;
    }

    if ( match_text === 'any' || match_text === "" ) {
        if ( [ 'update_date', 'score', 'create_date'].indexOf(orderby) < 0 ) {
            orderby = 'create_date'
            query_desr_str = `${match_text}|create_date`
        }
        let results = from_all_files(orderby)
        return [results, query_desr_str]
    }

    try {
    
        let results = g_global_file_list.reduce((prev,current) => {
            if ( good_match(current,match_text) ) {
                prev.push(current)
            }
            return(prev)
        },[])

        switch ( orderby ) {
            case 'update_date' :  {
                //console.log('update_date ' + orderby)
                query_desr_str = `${match_text}|update_date`
                results = sort_by_updated(results)
                break;
            }
            case 'score' : {
                //console.log('score ' + orderby)
                query_desr_str = `${match_text}|score`
                results = sort_by_score(results)
                break;
            }
            case 'create_date' :
            default: {
                //console.log('create_date ' + orderby)
                query_desr_str = `${match_text}|create_date`
                results = sort_by_created(results)
                break;
            }
        }

        results = results.map((item,index)=> {
            let c_item = JSON.parse(JSON.stringify(item))
            c_item.entry = index + 1
            return(c_item)
        })

        return [results,query_desr_str]
    } catch(e) {
        console.log(e)
        return([])
    }
}


// // 
// prune_searches
// // 
function prune_searches() {
    //
    console.log("pruning searches")
    let prune_time = Date.now()
    //
    let searches = Object.keys(g_local_active_searches)
    //
    let count = 0
    searches.forEach(srch => {
        let q_obj = g_local_active_searches[srch]
        let when = q_obj.when
        if ( (prune_time - TIMEOUT_THRESHHOLD) > when ) {
            delete g_local_active_searches[srch]
            count++
        }
    })
    //
    console.log(`searches pruned: ${count}`)
}


async function run_query(query) {
    let q = new QueryResult(query)
    return [q,q.query]
}


async function get_search(query,offset,box_count) {
    let result = g_local_active_searches[query]
    if (  result !== undefined  ) {
        let data_descr = result.access(offset,box_count)
        return data_descr
    } else {
        // create one...
        let [q_obj, normalized_query] = await run_query(query)
        g_local_active_searches[normalized_query] = q_obj
        let data_descr = q_obj.access(offset,box_count)
        return data_descr
    }

}


async function process_search(req) {
    //console.log(req.body)
    //console.log(req.params)
    let query = req.params.query;
    let box_count = parseInt(req.params.bcount);
    let offset = parseInt(req.params.offset);
    //
    let search_results = await get_search(query,offset,box_count);
    //
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


app.get('/:uid/:query/:bcount/:offset', async (req, res) => {
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
    let uid = req.params.uid;
    let data = await user_get(uid)
    res.send(data)
})

app.post('/user/:uid', async (req, res) => {
    let uid = req.params.uid;
    if ( rate_limited(uid) ) {
        return rate_limit_redirect(req,res)
    }

    let data = await process_search(req)
    res.send(data)
})

app.get('/cycle/:halt', (req, res) => {
    let do_halt = req.params.halt
    backup_searches(do_halt)
    res.send("OK")
})


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
restore_searches()
//
// //
g_prune_timeout = setInterval(prune_searches,TIMEOUT_THRESHHOLD_INTERVAL)
//
//
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

