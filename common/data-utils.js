
const TESTING = false


export function clonify(obj) {
    let o = JSON.parse(JSON.stringify(obj))
    return o
}


let thing_template = {
    "color": 'grey',
    "title" : "no content",
    "_tracking" : false,
    "dates" : {
        "created" : "never",
        "updated" : "never"
    },
    "subject" : "",
    "abstract" : "no content",
    "keys" : [  ],
    "media" : {
        "_x_link_counter" : "nowhere",
        "protocol" : "default",
        "poster" : "test",
        "source" : "test"
    },
    "components" : {
        "graphic" : [],
        "boxes" : []
    },
    "comments" : [],
    "score" : 1.0
}


export function make_empty_thing(model_template,no_clone) {
    if ( model_template !== undefined ) {
        thing_template = model_template
        app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template)
    } else {
        model_template = thing_template
    }
    if ( no_clone ) {
        return Object.assign({},app_empty_object)
    }
    return clonify(model_template)
}

let app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template)



function padd_other_things(count,other_things) {
    let n = count - other_things.length
    while ( n > 0 ) {
        other_things.push(false)
        n--
    }
}



export function place_data(things,other_things,article_index,dstart) {
    let l = things.length;
    let lo = other_things.length;
    //
    let strt = (( dstart === undefined ) ? (article_index-1) : (dstart-1));
    //
    for ( let i = 0; i < l; i++ ) {
        if ( (strt + i) < lo ) {
            let oto = other_things[strt + i];
            if ( oto !== false ) {
                oto.id = i+1;
                things[i] = oto;
            } else {
                let ceo = clonify(app_empty_object);
                ceo.id = i+1;
                things[i] = ceo;
            }
        } else {
            let ceo = clonify(app_empty_object);
            ceo.id = i+1;
            things[i] = ceo;
        }
    }
    return things
}


export function merge_data(merger,things,other_things,article_index,dstart) {
    let l = things.length;
    let lo = other_things.length;
    //
    let strt = (( dstart === undefined ) ? (article_index-1) : (dstart-1));
    //
    for ( let i = 0; i < l; i++ ) {
        if ( (strt + i) < lo ) {
            let oto = other_things[strt + i];
            if ( oto !== false ) {
                oto.id = i+1;
                things[i] = merger(things[i],oto);
            } else {
                let ceo = clonify(app_empty_object);
                ceo.id = i+1;
                things[i] = merger(things[i],ceo);
            }
        } else {
            let ceo = clonify(app_empty_object);
            ceo.id = i+1;
            things[i] = merger(things[i],ceo);
        }
    }
    return things
}


let faux_data = () => { return []}
if ( TESTING ) {
    function test_produce_data() {		// retun the same object with all its fields only changing ones tranported encoded
        let usable_data = [
            {
                "entry" : "" + Math.floor(Math.random()*1000), 
                "_tracking" : "100001",
                "subject" : "test 1", "title" : "test1 title", "score" : 2.3, 
                        "txt_full" : "something to talk about...", "abstract" : "absctraction", "keys" : ["t1", "t2"],
                        "dates" : {
                            "created" : Date.now(),
                            "updated" : Date.now(),
                        },
                "media" : {
                    "protocol" : "default",
                    "_tracking" : "100001",
                    "_x_link_counter" : "nowhere",
                    "protocol" : "default",
                    "poster" : "test",
                    "source" : "test"
                },
                "color" : "darkbrown"
            },
            {
                "entry" : "" + Math.floor(Math.random()*1000),
                "_tracking" : "100002",
                "subject" : "test 2", "title" : "test2 title", "score" : 2.2,
                "txt_full" : "two something to talk about...", "abstract" : "too absctraction", "keys" : ["t1", "t2"],
                        "dates" : {
                            "created" : Date.now(),
                            "updated" : Date.now(),
                        },
                "media" : {
                    "protocol" : "default",
                    "_tracking" : "100002",
                    "_x_link_counter" : "nowhere",
                    "protocol" : "default",
                    "poster" : "test",
                    "source" : "test"
                },
                "color" : "blue"
            },
            { 
                "entry" : "" + Math.floor(Math.random()*1000),
                "subject" : "test 3", "title" : "test3 title", "score" : 2.1,
                "_tracking" : "100003",
                "txt_full" : "three's something to talk about...", "abstract" : "triangle absctraction", "keys" : ["t1", "t2"],
                        "dates" : {
                            "created" : Date.now(),
                            "updated" : Date.now(),
                        },
                "media" : {
                    "protocol" : "default",
                    "_tracking" : "100003",
                    "_x_link_counter" : "nowhere",
                    "protocol" : "default",
                    "poster" : "test",
                    "source" : "test"
                },
                "color" : "yellow"
            },
            {
                "entry" : "" + Math.floor(Math.random()*1000), 
                "_tracking" : "100004",
                "subject" : "test 4", "title" : "test4 title", "score" : 2.0,
                "txt_full" : "fore's something to talk about...", "abstract" : "square absctraction", "keys" : ["t1", "t2"],
                        "dates" : {
                            "created" : Date.now(),
                            "updated" : Date.now(),
                        },
                "media" : {
                    "protocol" : "default",
                    "_tracking" : "100004",
                    "_x_link_counter" : "nowhere",
                    "protocol" : "default",
                    "poster" : "test",
                    "source" : "test"
                },
                "color" : "red"
            }
        ]


        let exportable_data = usable_data.map(datum => {
            datum.title = datum.title ? decodeURIComponent(datum.title) : "no title"
            datum.abstract = datum.abstract ? decodeURIComponent(datum.abstract) : "no abstract"
            if (  datum.keys && Array.isArray(datum.keys) ) {
                datum.keys = datum.keys.map(key => {
                    return(decodeURIComponent(key))
                })                
            }
            return datum
        })
        return { 
            "status" : "OK",
            "count" : 4,
            "data" : exportable_data
        }
    }

    faux_data = test_produce_data
}


export async function link_server_fetch(url, post_params, postData) {
    if ( TESTING ) {
        return faux_data()
    } else {
        if ( typeof window.personalization === 'function' )
            window.personalization(post_params)
    }
        return await postData(url, post_params)
}


//
export function unload_data(data) {
    let usable_data = data.map(datum => {
        datum.title = datum.title ? decodeURIComponent(datum.title) : "no title"
        datum.abstract = datum.abstract ? decodeURIComponent(datum.abstract) : "no abstract"
        if (  datum.keys && Array.isArray(datum.keys) ) {
            datum.keys = datum.keys.map(key => {
                return(decodeURIComponent(key))
            })                
        }
        return datum
    })
    return usable_data
}

//
export function process_search_results(stindex,qstart,search_result,other_things,data_unloader) {
    //
    let article_index = 1
    //
    if ( search_result ) {
        let data = search_result.data;
        if ( data ) {
            //
            if ( data_unloader !== undefined ) {
                data = data_unloader(data)
            } else {
                data = unload_data(data)
            }
            //
            let lo = search_result.count;
            if ( qstart === undefined ) {	// used the search button
                if ( lo > data.length ) {
                    padd_other_things(lo,data)
                }
                return [1,lo,data]
            } else {
                //
                if ( lo > other_things.length ) {
                    padd_other_things(lo,other_things)
                }
                //
                let n = data.length
                for ( let i = 0; i < n; i++ ) {
                    other_things[i + stindex] = data.shift()
                }
                // // 
            }
            //
            return [article_index,lo,other_things]
        }
    }
    //
    return [false,false,false]
}



export function remove_duplicate_entries(ply2_ary) {
    let deletes = []
    let n = ply2_ary.length;
    for (let i = 0; i < n; i++ ) {
        let chk = ply2_ary[i]
        let next_i = i
        for ( let j = i+1; j < n; j++ ) {
            let tst = ply2_ary[j]
            if ( chk[0] === tst[0] ) {
                if ( chk[1] === tst[1] ) {
                    deletes.push(j)
                    next_i++
                }
            }
        }
        i = next_i
    }

    while ( deletes.length ) {
        let dj = deletes.pop()
        if ( dj !== undefined ) {
            ply2_ary.splice(dj,1)  
        }
    }
    return ply2_ary
}
