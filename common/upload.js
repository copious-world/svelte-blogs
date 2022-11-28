/*


function extract_sound_media_ext(file_src) {
	let dot = file_src.lastIndexOf('.')
	if ( dot < 0 ) return("mpeg") // default .. e.g. from a streaming service
	let ext = file_src.substr(dot)
	if ( ext === '.ogg') return("ogg")
	return("mpeg")
}


function get_ext(fname) {
	let ext = fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
	if ( ext.length > 0 ) ext = '.' + ext
	return ext
}


function best_cat_for_ext(ext) {
	if ( g_code_files.indexOf(ext) >= 0 ) return ("blog")
	else if ( g_text_files.indexOf(ext) >= 0 ) return ("blog")
	else if ( g_media_files.indexOf(ext) >= 0 ) return ("stream")
	return("blog")
}


function is_link(file_name) {
	if ( file_name[0] === '/' ) return(true)
	let tester = "http:"
	if ( file_name.substr(0,tester.length) === tester) return true
	tester = "https:"
	if ( file_name.substr(0,tester.length) === tester) return true
	tester = "wss:"
	if ( file_name.substr(0,tester.length) === tester) return true
	tester = "ipfs:"
	if ( file_name.substr(0,tester.length) === tester) return true
	return(false)
}


function check_category(category,file_name) {
	//
	if ( file_name === undefined ) {
		return category
	}
	if ( is_link(file_name) ) {
		return category
	}
	//
	let ext = get_ext(file_name)
	if ( ext.length ) {
		let fit_cat = best_cat_for_ext(ext)
		return(fit_cat)
	}
	//
	return category
}


function add_or_use_url(url) {
	let cat = g_current_sel_display
	// update_edit_display(g_current_edit_el)
	if ( g_current_edit_el ) {
		let el_id = g_current_edit_el.id
		let entry = get_entry(get_id(el_id))
		if ( !(entry) ) return;
		//
		switch ( entry.asset_type ) {
			case "links" : {
				//
				entry.links.push(url)
				break;
			}
			case "stream" : {
				//
				if ( entry.media ) {
					entry.media.source = url
				}
				break;
			}
			default : return
		}
		//
		update_edit_display(g_current_edit_el) 
	}
}


function best_fit_media_type(file_name) {
	//if ( category == 'stream' ) {
		let ext =  get_ext(file_name)
		let mtype = g_ext_to_media_type[ext]
		if ( mtype === undefined ) {
			mtype = 'text'
		}
		return(mtype)
	//}
	//return undefined
}


//
let g_code_files = [ ".js", ".c",  ".cpp", ".c++",  ".cc", ".v", ".rs" ]

let g_audio_files =  [ ".mp3",  ".ogg",  ".wav"  ]
let g_image_files = [ ".jpeg", ".gif", ".png" ]
let g_video_files = [ .mp4",  ".mpeg" ]
let g_media_files = [ ".mp3", ".mp4",  ".mpeg", ".ogg",  ".wav", ".jpeg", ".gif", ".png" ]
let g_text_files = [ ".txt", ".text", ".html", ".svg", ".htm" ]


let g_ext_to_media_type = {
	".mp3" : "audio", 
	".mp4" : "video",  
	".mpeg" : "video", 
	".ogg" : "audio",  
	".wav" : "audio", 
	".jpeg" : "image", 
	".gif" : "image",
	".png" : "image",
	//
	".txt" : "text",
	".text" : "text", 
	".html" : "text", 
	".svg" : "text", 
	".htm" : "text",
	//
	".js" : "text", 
	".c" : "text",
	".cpp" : "text",
	".c++" : "text",
	".cc" : "text",
	".v" : "text",
	".rs" : "text"
}

function readVideo(event) {
  if (event.target.files && event.target.files[0]) {
    var reader = new FileReader();

    reader.onload = function(e) {
      videoSrc.src = e.target.result
      videoTag.load()
    }.bind(this)

    reader.readAsDataURL(event.target.files[0]);
  }
}

function readBlob() {
    var files = document.getElementById('files').files;
    var file = files[0];
    var ONEMEGABYTE = 1048576;
    var start = 0;
    var stop = ONEMEGABYTE;

    var remainder = file.size % ONEMEGABYTE;
    var blkcount = Math.floor(file.size / ONEMEGABYTE);
    if (remainder != 0) blkcount = blkcount + 1;

    for (var i = 0; i < blkcount; i++) {

        var reader = new FileReader();
        if (i == (blkcount - 1) && remainder != 0) {
            stop = start + remainder;
        }
        if (i == blkcount) {
            stop = start;
        }

        //Slicing the file 
        var blob = file.slice(start, stop);
        reader.readAsBinaryString(blob);
        start = stop;
        stop = stop + ONEMEGABYTE;

    } //End of loop

} //End of readblob
*/

export function drop(items,files) {
    //
    let p = new Promise((resolve,reject) => {
        if ( items ) {
            // Use DataTransferItemList interface to access the file(s)
            for ( let i = 0; i < items.length; i++ ) {
                if ( items[i].kind === 'file' ) {
                    let file = items[i].getAsFile();
                    let fname = file.name
                    var reader = new FileReader();
                    reader.onload = async (e) => {
                        let blob64 = e.target.result
                        resolve([fname,blob64])
                    };
                    reader.readAsDataURL(file)
                    break
                }
            }
        } else if ( files ) {
            // Use DataTransfer interface to access the file(s)
            for ( let i = 0; i < files.length; i++ ) {
                var reader = new FileReader();
                let file = files[i]
                let fname = file.name
                reader.onload = (e) => {
                    let blob64 = e.target.result
                    resolve([fname,blob64])
                };
                reader.readAsDataURL(file)
                break
            }
        } else {
            reject(false)
        }
    })
    return p
}



// not really -- may use the file system API (load data into browser file system and then play it)
function drop_partial(items,files,sz_limit) {
    //
    let p = new Promise((resolve,reject) => {
        if ( items ) {
            // Use DataTransferItemList interface to access the file(s)
            for ( let i = 0; i < items.length; i++ ) {
                if ( items[i].kind === 'file' ) {
                    let file = items[i].getAsFile();
                    let fname = file.name
                    var reader = new FileReader();
                    reader.onload = async (e) => {
                        let blob64 = e.target.result
                        resolve([fname,blob64])
                    };
                    reader.readAsDataURL(file)
                    break
                }
            }
        } else if ( files ) {
            // Use DataTransfer interface to access the file(s)
            for ( let i = 0; i < files.length; i++ ) {
                var reader = new FileReader();
                let file = files[i]
                let fname = file.name
                let blob = file.slice(0, sz_limit)
                reader.onload = (e) => {
                    let blob64 = e.target.result
                    resolve([fname,blob64])
                };
                reader.readAsDataURL(file)
                break
            }
        } else {
            reject(false)
        }
    })
    return p
}


export function check_empty(parameters) {
    //
    let b = parameters.some( el => {
        if ( el === false ) return true
        if ( (typeof el === "string")  && (el.length === 0) ) return true
        if ( typeof el === "undefined" ) return true
        return false
    })
    //
    return b
}


export function start_drag(ev) {
    ev.dataTransfer.dropEffect = "move";
    ev.dataTransfer.setData("filer", ev.target.getAttribute('id'));
}

export async function dropper(ev) {
    ev.preventDefault();
    try {
        let files = false;
        let items = false;
        if ( ev.dataTransfer ) {
            ev.dataTransfer.files ? ev.dataTransfer.files : false
            items = ev.dataTransfer.items ? ev.dataTransfer.items : false
        } else {
            return [false,false]
        }
        let [fname,blob64] = await drop(items,files)
        //
        if ( typeof handle_data === 'function' ) {
            await [fname,blob64]
        }
    } catch (e) {
        console.log(e)
    }
    return [false,false]
}



let g_audio_files =  [ ".mp3",  ".ogg",  ".wav"  ]
let g_image_files = [ ".jpeg", ".jpg",  ".gif", ".png" ]
let g_video_files = [ ".mp4",  ".mpeg" ]
let g_text_files = [ ".txt", ".text", ".html", ".svg", ".htm" ]
let g_code_files = [ ".js", ".c",  ".cpp", ".c++",  ".cc", ".v", ".rs" ]

//

export function dragOverHandler(ev) {
	ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
    ev.target.x_files = ev.dataTransfer.items
}

export let file_types = {
    "audio" : g_audio_files,
    "image" : g_image_files,
    "video" : g_video_files,
    "text" : g_text_files,
    "code" : g_code_files
}




export function convert_text(blob) {

    let p = new Promise((resolve,reject) => {
        try {
            var reader = new FileReader();
            reader.onload = (ev) => {
                resolve(ev.target.result)
            };
            reader.readAsText(blob);        
        } catch (e) {
            reject(e)
        }
    })

    return p

}




/*
// ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ----

function dropHandlerUpdates(ev) {
	ev.preventDefault();
	if ( ev.dataTransfer.items ) {
		// Use DataTransferItemList interface to access the file(s)
		for (let i = 0; i < ev.dataTransfer.items.length; i++) {
			if (ev.dataTransfer.items[i].kind === 'file') {
				let file = ev.dataTransfer.items[i].getAsFile();
				let fname = file.name
				let reader = new FileReader();
				reader.onload = (e) => {
					prepare_file_text(e.target.result,fname,'update-only',file.type)
				};
				reader.readAsText(file);
				break
			} else if (ev.dataTransfer.items[i].kind === 'string') {
				let maybe_url = ev.dataTransfer.items[i].getAsString()
				if ( matches_url(maybe_url) ) {
					add_or_use_url(maybe_url)
				}
			}
		}
	} else {
		// Use DataTransfer interface to access the file(s)
		for (let i = 0; i < ev.dataTransfer.files.length; i++) {
			let file = ev.dataTransfer.files[i].getAsFile();
			let fname = file.name
			var reader = new FileReader();
			reader.onload = (e) => {
				prepare_file_text(e.target.result,fname,'update-only',file.type)
			};
			reader.readAsText(file);
			break
		}
	}
}



// called in response to a file selection through the system file browser
//
function get_file(category) {
	let file_el = document.getElementById(`drop-click-file_loader-${category}`)
	file_el.addEventListener('change',(ev) => {
		let file = file_el.files[0]
		let fname =  file.name ? file.name : category_name_get(category)
		let mtype = best_fit_media_type(fname)
		let reader = new FileReader();
		if ( mtype == 'text' ) {
			reader.onload = (e) => {
				prepare_file_text(e.target.result,fname,category,file.type)
			};
			reader.readAsText(file);
		} else {
			reader.onload = (e) => {
				prepare_file_blob(e.target.result,fname,category,file.type)
			};
			reader.readAsDataURL(file)
		}
	})
	file_el.click()
}


// ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ----

function dropHandler(ev,category) {
	ev.preventDefault();
	if ( ev.dataTransfer.items ) {
		// Use DataTransferItemList interface to access the file(s)
		for (let i = 0; i < ev.dataTransfer.items.length; i++) {
			if (ev.dataTransfer.items[i].kind === 'file') {
				let file = ev.dataTransfer.items[i].getAsFile();
				let fname = file.name
				let mtype = best_fit_media_type(fname)
				var reader = new FileReader();
				if ( mtype == 'text' ) {
					reader.onload = (e) => {
						prepare_file_text(e.target.result,fname,category,file.type)
					};
					reader.readAsText(file);
				} else {
					reader.onload = (e) => {
						prepare_file_blob(e.target.result,fname,category,file.type)
					};
					reader.readAsDataURL(file)
				}
				break
			}
		}
	} else {
		// Use DataTransfer interface to access the file(s)
		for (let i = 0; i < ev.dataTransfer.files.length; i++) {
			let file = ev.dataTransfer.files[i].getAsFile();
			let fname = file.name
			let mtype = best_fit_media_type(fname)
			var reader = new FileReader();
			if ( mtype == 'text' ) {
				reader.onload = (e) => {
					prepare_file_text(e.target.result,fname,category,file.type)
				};
				reader.readAsText(file);
			} else {
				reader.onload = (e) => {
					prepare_file_blob(e.target.result,fname,category,file.type)
				};
				reader.readAsDataURL(file)
			}
			break
		}
	}
}



*/