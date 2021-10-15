
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
    "score" : 1.0
}


export function make_empty_thing() {
    return clonify(thing_template)
}

const app_empty_object = Object.assign({ "id" : 1, "entry" : -1 },thing_template)



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
            datum.title = encodeURIComponent(datum.title)
            datum.abstract = encodeURIComponent(datum.abstract)
            datum.keys = datum.keys.map(key => {
                return(encodeURIComponent(key))
            })
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
        return await postData(url, post_params)
    }
}


//
export function unload_data(data) {
    let usable_data = data.map(datum => {
        datum.title = decodeURIComponent(datum.title)
        datum.abstract = decodeURIComponent(datum.abstract)
        datum.keys = datum.keys.map(key => {
            return(decodeURIComponent(key))
        })
        return datum
    })
    return usable_data
}

//
export function process_search_results(stindex,qstart,search_result,other_things) {
    //
    let article_index = 1
    //
    if ( search_result ) {
        let data = search_result.data;
        if ( data ) {
            //
            data = unload_data(data)
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


