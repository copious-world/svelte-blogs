

const fs = require('fs')
const path = require('path'); 
const express = require('express')

//
//
//


let g_subdir = '/media/richard/ELEMENTS/data/demos' 

if ( process.argv[4] !== undefined ) {
    g_subdir = process.argv[4]
}

let shrink = 3.2
if ( process.argv[2] !== undefined ) {
    shrink = process.argv[2]
}

const SCORE_SHRINKAGE_FACTOR = shrink

let port = 3000

if ( process.argv[3] !== undefined ) {
    port = parseInt(process.argv[3])
}


//  

let g_global_file_list = []

let g_global_file_list_by = {
    "create_date" : [],
    "update_date" : []
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




function load_directory(dirpath,noisy) {
    console.log("loading blog entries")

    g_global_file_list = []

    fs.readdir(dirpath, (err, files) => {
        console.log("loading blog entries ... reading files")
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

