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


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// // // // // 
// ---- ---- ---- ---- COMMAND LINE PARAMETERS ---- ---- ---- ---- ----
let port = 3000
let shrink = 3.2
let g_update_dir = '/media/richard/ELEMENTS/data/users/records' 
let g_subdir = '/media/richard/ELEMENTS/data/users/records' 
//
if ( process.argv[2] !== undefined ) {          // Shrink
    shrink = process.argv[2]
}
if ( process.argv[3] !== undefined ) {          // port
    port = parseInt(process.argv[3])
}
if ( process.argv[4] !== undefined ) {          // g_subdir  --- location of new data
    g_subdir = process.argv[4]
}
const SCORE_SHRINKAGE_FACTOR = shrink
//
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----



let conf = {
    'port' : 5114,
    'address' : 'localhost',
    'file_shunting' : false
}

let conf_file = process.argv[5]
if ( conf_file !== undefined ) {
    conf = JSON.parse(fs.readFileSync(conf_file,'ascii').toString())
}


let g_message_relayer = new MessageRelayer(conf)


// ---- ----  ---- ---- WATH SUBDIRECTORY....
//
let g_watch_for_new_files = fs.watch(g_update_dir)  // watch for files in only one specific directory...
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

let sg_file_watcher = (eventType, filename) => {  // new or changed file
    // console.log(`event type is: ${eventType}`);
    if ( filename ) {
        let path = g_update_dir + '/' + filename
        let is_file = false
        try {
            fs.statSync(path)
            is_file = true
        } catch (e) {
            // suppress error
        }
        if ( is_file ) {
            console.log(`filename provided: ${filename}`);
            // READ NEW FILE
            fs.readFile(path,(err,data) => {
                if ( err ) { console.log(err); return; }
                // 
                add_just_one_new(data.toString())       //  ----  ADD ONE NEW RECORD.....
                //
            })
            // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        } else {
            console.log("file gone")
        }
    } else {
      console.log('filename not provided');
    }
}
//
// FILE CHANGE LISTENER
g_watch_for_new_files.on('change',sg_file_watcher);

// 
// when creating assets for a new user, use templates and put them in user specific directories
// 
// 


//  

let g_global_file_list = []

let g_global_file_list_by = {
    "create_date" : [],
    "update_date" : []
}


let g_template_package = {
    "profile" : "",
    "dashboard" : ""
}


function load_template_package(templatedir,noisy) {

    fs.readdir(templatedir, (err, files) => {
        console.log("loading user templates ... reading files")
        if (err)  {
            console.log(err);
            process.exit(0)
        } else { 
            // console.log("\Filenames with the .txt extension:"); 
            files.forEach(file => { 
                let ext = path.extname(file)
                if ( path.extname(file) == ".json" ) {
                    if ( noisy ) {
                        console.log(file)
                    }
                    //
                    let fpath = dirpath + '/' + file
                    let fdata = fs.readFileSync(fpath).toString()
                    try {
                        let f_obj = JSON.parse(fdata)
                        let stem_index = file.lastIndexOf('-')
                        stem_index = stem_index < 0 ? 0 : (stem_index + 1)
                        let key = file.replace(ext,'').substr(stem_index)
                        g_template_package[key] = f_obj;
                    } catch(e) {
                        console.log(file)
                    }
                    //
                } 
            })
            //
        }
    })

}


function load_directory(dirpath,noisy) {
    console.log("loading user entries")

    g_global_file_list = []

    fs.readdir(dirpath, (err, files) => {
        console.log("loading user entries ... reading files")
        if (err)  {
            console.log(err);
            process.exit(0)
        } else { 
            // console.log("\Filenames with the .txt extension:"); 
            files.forEach(file => { 
                if ( path.extname(file) == ".json" ) {
                    if ( noisy ) {
                        console.log(file)
                    }
                    //
                    let fpath = dirpath + '/' + file
                    let fdata = fs.readFileSync(fpath).toString()
                    try {
                        let f_obj = JSON.parse(fdata)
                        g_global_file_list.push(f_obj)    
                    } catch(e) {
                        console.log(file)
                    }
                    //
                } 
            })
            //
            //
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
    }) 
  
}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
load_template_package()


// to be spawned --- do not want to keep this in process... 
const Handlebars = require('handlebars')


async function generate_user_custom_file(path,template_src,user_obj) {
    try {
        let template = Handlebars.compile(template_src);
        let content = template(user_obj);
        await fsPromises.writeFile(path,content)    
    } catch (e) {
    }
}

async function publish_static(user_obj) {
    //
    let topic = 'user-assets'
    let result = await g_message_relayer.publish(topic,user_obj)
    console.log(result)
    //
}


async function add_user_subdir(which_dir,subir) {
    // create the dir if it is not there...
    try {
        await fsPromises.mkdir(which_dir)
        if ( subir ) {
            await fsPromises.mkdir(which_dir + '/' + subir)
        }    
    } catch (e) {
    }
}

var g_public_keys = ['picture', 'bio', 'name', 'key-words']
//
function public_view_user(f_obj) {
    let pub_view = {}
    for ( let ky in f_obj ) {
        if ( ky in g_public_keys ) {
            pub_view[ky] = f_obj[ky]
        }
    }
    return pub_view
}


async function add_just_one_new(fdata) {
    try {
        let f_obj = JSON.parse(fdata)
        let user_dir = f_obj.dirpath
        //
        if ( user_dir ) {
            //
            await add_user_subdir(user_dir)
            //
            let template_dashboard = g_template_package.dashboard
            let dash_path = user_dir + '/' + g_template_package.dashboard_file
            generate_user_custom_file(dash_path,template_dashboard,f_obj)

            f_obj.dashboard = dash_path

            let template_profile = g_template_package.profile
            let profile_path = user_dir + '/'  + g_template_package.profile_file
            generate_user_custom_file(profile_path,template_profile,f_obj)
            f_obj.profile = profile_path
            //
            publish_static(f_obj)

            add_user_subdir(user_dir,"assets")       // profile pictures, jingles, etc. peculiar to identifying the user, etc.
            add_user_subdir(user_dir,"blog")         // nonpublic publication
            add_user_subdir(user_dir,"streams")      // private stream collection (or playlist)
            add_user_subdir(user_dir,"demos")        // work in progress demos 
            add_user_subdir(user_dir,"ownership")    // assests created by the likes of (Song Catcher ... blockchain interfaces)
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



function add_just_one(fdata) {
    try {
        let f_obj = JSON.parse(fdata)
        let searchable = public_view_user(f_obj)
        //
        g_global_file_list.push(seachable)
        f_obj.entry = g_global_file_list.length
        f_obj.score = 1.0
        g_global_file_list_by["create_date"].push(searchable)
        g_global_file_list_by["update_date"].push(searchable)
        g_currently_loaded_users[f_obj.uid] = f_obj
    } catch (e) {
        console.log(e)       
    }
}


//
//
//





g_currently_loaded_users = {}

function user_get(uid) {
    let user = g_currently_loaded_users[uid]
    if ( user ) {
        return user
    }
    if ( exists_user_dir(uid) ) {
        let path = g_subdir + '/' + filename
        console.log(path)
        let is_file = false
        try {
            fs.statSync(path)
            is_file = true
        } catch (e) {
            // suppress error
        }
        if ( is_file ) {
            console.log(`filename provided: ${filename}`);
            fs.readFile(path,(err,data) => {
                if ( err ) {
                    console.log(err)
                } else {
                    add_just_one(data.toString())
                }
            })
        } else {
            console.log("file gone")
        }
    }
}




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







function from_all_files(orderby) {
    if ( orderby in g_global_file_list_by ) {
        return g_global_file_list_by[orderby]
    }
    return g_global_file_list_by["create_date"]
}


function sort_by_updated(results) {
    results = results.sort((a,b) => {
        return(b.dates.updated - a.dates.updated)
    })
    return results
}


function sort_by_created(results) {
    results = results.sort((a,b) => {
        return(b.dates.created - a.dates.created)
    })
    return results
}


function sort_by_score(results) {
    results = results.sort((a,b) => {
        return(b.score - a.score)
    })
    return results
}

// //
// setup app
const app = express()

// // // 



// ----
let g_local_active_searches = {}

let g_prune_timeout = null
const PRUNE_MINUTES = 30
const TIMEOUT_THRESHHOLD = 8*60*60     // in seconds
const TIMEOUT_THRESHHOLD_INTERVAL = (1000*60)*PRUNE_MINUTES


// ----

load_directory(g_subdir)



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

//
restore_searches()


/*

{
"id" : thing_counter, "color": "grey",
"title" : "",
"dates" : {
    "created" : "never",
    "updated" : "never"
},
"subject" : "",
"keys" : [  ],
"t_type" : "",
"txt_full" : ""
}

*/


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

//
// 
// //
g_prune_timeout = setInterval(prune_searches,TIMEOUT_THRESHHOLD_INTERVAL)



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



function rate_limited(uid) {
    return false
}



function rate_limit_redirect(req,res) {
    return res.redirect('/')
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




app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

