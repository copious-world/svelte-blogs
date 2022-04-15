// BLOG PAGES :: APP (HUMAN FRAME)


url_for_use = (frame_use) => {
    let loc = location.host
    let proto = location.protocol
    let url = `${proto}//${loc}/${frame_use}`
    return url
}


// APP PAGES
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// WINDOW OPENER (for comments and asset creation)

async function open_intergalactic_session_window(frame_use,human_info,session) {
    if ( human_info ) {
        g_current_pub_identity = human_info
        let human_frame_url = human_info.human_frame_url
        let [frame_window,uri_of_launch] = await open_app_page_in_human_frame(human_frame_url,frame_use)
        if ( frame_window && session ) {
            let message = {
                "category": SITE_TO_FRAME_SESSIONS,
                "action" : FRAME_HAS_SESSION,
                "data" : session
            }

            tell_frame_page(message)
        }
    }
}



async function application_specific_handlers(category,action,relationship,params) {

}


async function launch_comment_editor(session,entry) {
	await open_intergalactic_session_window(`comment-edit/${entry}`,g_current_pub_identity,session)
}

async function launch_asset_editor(session) {
	await open_intergalactic_session_window("asset-edit/$$asset-type",g_current_pub_identity,session)
}

/*
"data" : {
	"session" : session,
	"ccwid" : ccwid
}
*/

var g_current_session_data = false
var g_current_user_preferences = false
personalization = (post_params) => {
	if ( g_current_session_data !== false ) {
		post_params.session = g_current_session_data
	}
	if ( g_current_user_preferences !== false ) {
		post_params.preferences = g_current_user_preferences
	}
}

injest_session = (session_data) => {
	g_current_session_data = session_data
}


injest_personalization = async (action,params) => {
	g_current_user_preferences = params
}
