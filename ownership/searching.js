const fs = require('fs')


class QueryResult {

    // The constructor has two modes. One is for a new query. The other is for a query that is being restored from disk.
    constructor(query,restore) {
        this.original_query = query // for record keeping
        if ( restore === undefined ) {
            let normalized_query = this.normalize_query(query_desr_str)
            this.stored_data = []  // will be set later
            this.query = normalized_query
            this.when = Date.now()
        } else {
            this.stored_data = restore.stored_data
            this.query = restore.query
            this.when = Date.now()
        }
    }

    // set_data
    //      store the data that matched the query stored in the instance of this class
    set_data(data) {        // keep the query results
        this.stored_data = data
    }

    // clear
    //      throw data away.
    clear() {
        this.stored_data = []
    }


    // normalize_query
    // This method expects a single parameter, the original search query string with a specific format.
    // This method uses the two part string in order to generate a querh easily used by _run_query in descendens of searching.
    // The query format expected is a two part string with a shef separator '|' The left side of the separator must be a 
    // url encoded list of key words separated by spaces. When it is decoded, the key words will be separated by spaces.
    // The second part specifies an ordering. The stored data objects are expeceted to have a date object field containg two fields,
    // one for updated and the other for created (creation date).   A field 'score' is expected as part of the objects stored in the 
    // data arrays. As such:
    //  {
    //      'score' : <number>,
    //      'dates' { 'create_date' : <number>, 'update_date' : <number> }
    //  }

    normalize_query(query_desr_str) {
        let orderby = 'create_date'
        let match_text = 'any'

        query_desr_str = query_desr_str.trim()
        try {
            let qparts = query_desr_str.split("|")
            qparts = qparts.map(apart => { return apart.trim() })
            match_text = decodeURIComponent(qparts[0])
            orderby = qparts[1]
        } catch (e) {
            console.log(e)
            return(false);
        }

        if ( match_text === 'any' || match_text === "" ) {  // only got the second part (ordering) 'any|something' or '|something'
            if ( [ 'update_date', 'score', 'create_date'].indexOf(orderby) < 0 ) {
                orderby = 'create_date'
                query_desr_str = `${match_text}|create_date`
            }
        }

        if ( (orderby === undefined) ||  (orderby.length === 0) ) {
            orderby = 'create_date'
        }

        switch ( orderby ) {
            case 'update_date' :  {
                query_desr_str = `${match_text}|update_date`
                break;
            }
            case 'score' : {
                query_desr_str = `${match_text}|score`
                break;
            }
            case 'create_date' :
            default: {
                query_desr_str = `${match_text}|create_date`
                break;
            }
        }

        return(query_desr_str)
    }


    //  access
    //  Returns a slice of the data array which was created in response to finding matches to the query 
    //  belonging to this class. Updates the timestamp for recent use.
    access(offset,box_count) {
        //
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





class Searching {

    //
    constructor(conf,QueryInterfaceClass) {
        //  these are to be external references -- set_global_file_list_refs or no searching...
        this.global_file_list = {}
        this.global_file_list_by = {}
        //
        this.local_active_searches = {}
        //
        this.shrinkage = conf.shrinkage
        this.backup_file = conf.search_backup_file
        //
        this.QInterfaceClass = ((QueryInterfaceClass !== undefined) ? QueryInterfaceClass : QueryResult)
        //
    }

    set_global_file_list_refs(ref_big_list,ref_big_list_by) {
        this.global_file_list = ref_big_list
        this.global_file_list_by = ref_big_list_by
    }

    //  creats new queries
    async run_query(query) {
        let q = new QueryResult(query)
        let [match_text,orderby] = q.query.split('|')
        let data = this._run_query(match_text,orderby)
        q.set_data(data)
        return [q,q.query]
    }


    async get_search(query,offset,box_count) {
        //
        //  try to find a search a query result object for this query
        //
        let result = this.local_active_searches[query]
        if (  result !== undefined  ) {
            let data_descr = result.access(offset,box_count)
            return data_descr
        } else {
            // could not find one so create a new one...
            let [q_obj, normalized_query] = await this.run_query(query)
            this.local_active_searches[normalized_query] = q_obj
            let data_descr = q_obj.access(offset,box_count)
            return data_descr
        }
    }



    from_all_files(orderby) {
        if ( orderby in this.global_file_list_by ) {
            return this.global_file_list_by[orderby]
        }
        return this.global_file_list_by["create_date"]
    }


    
    // ORDERING....

    // Order a set of record by the time they were updated... (they must include a 'dates' structure field)
    sort_by_updated(results) {
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
    
    // Order a set of record by the time they were created... (they must include a 'dates' structure field)
    sort_by_created(results) {
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

    // Order a set of record by a monotonic score... (they must include a 'score' numeric field)
     sort_by_score(results) {
        results = results.sort((a,b) => {
            return(b.score - a.score)
        })
        return results
    }
    
   
    // implement in descendant
    score_match(check_txt,q_list,mult) {
        let scort = 1.0
        return(score*mult)
    }
    
    good_match(f_obj,match_text) {
        return(true)
    }
    // END OF ORDERING....



    // _run_query
    _run_query(match_text,orderby) {

        if ( match_text === 'any' ) {
            let results = this.from_all_files(orderby)
            return results
        }

        try {

            let results = this.global_file_list.reduce((prev,current) => {
                if ( this.good_match(current,match_text) ) {
                    prev.push(current)
                }
                return(prev)
            },[])

            switch ( orderby ) {
                case 'update_date' :  {
                    results = this.sort_by_updated(results)
                    break;
                }
                case 'score' : {
                    results = this.sort_by_score(results)
                    break;
                }
                case 'create_date' :
                default: {
                    results = this.sort_by_created(results)
                    break;
                }
            }

            // creating copies of the objects 
            results = results.map((item,index)=> {
                let c_item = Object.assign({},item)
                c_item.entry = index + 1
                return(c_item)
            })

            return results      // the list of matching items
        } catch(e) {
            console.log(e)
            return([])  // something went wrong... so nothing
        }
    }


    ///
    update_global_file_list_quotes_by() {

        let c_results = this.sort_by_created(this.global_file_list)
        let u_results = this.sort_by_updated(this.global_file_list)
        //
        this.global_file_list_by["create_date"] = c_results.map((item,index)=> {
            item.entry = index + 1
            item.score = 1.0
            return(item)
        })
        //
        this.global_file_list_by["update_date"] = u_results.map((item,index)=> {
            item.entry = index + 1
            item.score = 1.0
            return(item)
        })
        //
    }


    prune(delta_timeout) {    
        let prune_time = Date.now()
        //
        let searches = Object.keys(this.local_active_searches)
        //
        let count = 0
        searches.forEach(srch => {
            let q_obj = this.local_active_searches[srch]
            let when = q_obj.when
            if ( (prune_time - delta_timeout) > when ) {
                let q = this.local_active_searches[srch]
                q.clear()
                delete this.local_active_searches[srch]
                count++
            }
        })

        return count
    }


    /// FILES
    // ----
    backup_searches(do_halt) {
        console.log("backing up searches")
        let output = JSON.stringify(this.local_active_searches)
        fs.writeFile(this.backup_file,output,'ascii',(err) => {
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


    restore_searches() {
        console.log("restoring searches")
        try {
            let searchbkp = fs.readFileSync(this.backup_file,'ascii').toString()

            this.local_active_searches = {}

            let stored_obj = JSON.parse(searchbkp)    
            for ( let k in stored_obj ) {
                let restored = stored_obj[k]
                let q = new QueryResult('',false,false,restored)
                this.local_active_searches[k] = q
            }

        } catch (e) {
            console.log(e)
        }
    }


    clear(query) {
        let q = this.local_active_searches[query]
        if ( q ) {
            q.clear()
            delete this.local_active_searches[query]
        }
    }

    add_just_one(f_obj,from_new) {
        let is_new = from_new == undefined ? false : from_new
        if ( f_obj.dates === undefined ) {
            is_new = true
            f_obj.dates = {
                "created" : Date.now(),
                "updated" : Date.now()
            }
        }
        //
        if ( is_new ) {
            this.global_file_list.unshift(f_obj)
            f_obj.entry = this.global_file_list.length
            f_obj.score = 1.0
            this.global_file_list_by["create_date"].unshift(f_obj)
            this.global_file_list_by["update_date"].unshift(f_obj)    
        } else {
            if ( f_obj.is_updating ) {
                let n = this.global_file_list.length
                for ( let i = 0; i < n; i++ ) {
                    if ( this.global_file_list[i].asset_id === f_obj.asset_id ) {
                        this.global_file_list[i] = f_obj
                    }
                }
                this.update_global_file_list_quotes_by()
            } else {
                this.global_file_list.push(f_obj)
                f_obj.entry = this.global_file_list.length
                f_obj.score = 1.0
                this.update_global_file_list_quotes_by()
            }
        }
    }
}



module.exports.Searching = Searching
module.exports.QueryResult = QueryResult