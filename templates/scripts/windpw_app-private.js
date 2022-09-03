
///   APPLICATION CODE -- -- -- -- -- -- -- 

function hide_interface_box() {
	let display = document.getElementById('interface-box')
	if ( display ) {
		display.style.visibility = "hidden"
		display.style.display = "none"
	}
}

function hide_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "hidden"
		display.style.display = "none"
	}
}

function show_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "visible"
		display.style.display = "block"
	}
}

hide_box('error-box')
hide_box('success-box')

async function post_submit(fields) {
	let bdy = {}
	fields.forEach(element => {
		let fld = document.getElementById(element)
		if ( fld ) {
			bdy[element] = fld.value
		}
	});
	let url = bdy.post_url
	if ( url ) {
		delete bdy.post_url
		//
		let resp = await postData(url, bdy)
		//
		if ( resp ) hide_interface_box()
		if ( resp && (resp.OK === 'true') ) {
			show_box('success-box')
		} else {
			show_box('error-box')
		}
	}
}



retrieve_session = () =>  {
	let message = {
		"category": FRAME_ACTION_FROM_APP,
		"action" : HOST_APP_WANTS_SESSION,
		"data" : false
	}
	tell_frame_page(message)
}



retrieve_personalization = () =>  {
	let message = {
		"category": FRAME_ACTION_FROM_APP,
		"action" : HOST_APP_PERSONALIZATION,
		"data" : false
	}
	tell_frame_page(message)
}



// ---- ---- ---- ---- ---- ----
injest_personalization = (action,params) => {

	let preferences = params.personalization
	let public_id = params.puplic_info

}

// ---- ---- ---- ---- ---- ----
injest_session = (action,params) => {

	let session = params.session

}


/*
let post_params = {
	"uid" : uid,
	"query" : qry,
	"box_count" : l,
	"offset" : stindex
};
*/

function personalization(post_params) {
	// look for ucwid, session, etc.
	// alter the post_params to queue the search engine what to get...
	//

	//
}
