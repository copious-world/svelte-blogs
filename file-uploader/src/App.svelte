<script>
    //
    import VideoPlayer from 'svelte-video-player';
    import FloatWindow from 'svelte-float-window';
    import FileManager from './FileManager.svelte';
    //
	import { popup_size } from '../../common/display-utils.js'
    import { onMount } from 'svelte';
    // ----
    import {file_types, start_drag, dragOverHandler, dropper, drop, convert_text } from '../../common/upload'

    //import frame_messaging from '../../common/human_frame'

    export const name = "file-uploader"

    let  avatar, fileinput;

    // ALLOW CUSTOMIZATION VIA roll-right
    const business_accepts_code = false


    let list_of_types = [
        {"type_name" : "text", "supported" : true},
        {"type_name" : "audio", "supported" : true},
        {"type_name" : "image", "supported" : true},
        {"type_name" : "video", "supported" : true},
        {"type_name" : "code", "supported" : business_accepts_code}
    ]



    let text_view = ""
    let code_view = ""
    let svg_text = ""
    let nothing_special = true
    let special_text = ""
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let g_upload_type = "Image"
    let accepted = ".jpg, .jpeg, .png"
    let icon_by_type = "../images/image-guess.png"
    let upload_icon = "../images/upload-icon.png"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let upload_done = false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let audio = false
    let paused = false
    let source_link_update = ""
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    let isplaying = false
    let poster_link = "../images/video-guess.png"
    let source_link = ""
    let source = ''
    let poster = ''
    let show_video = false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let there_is_going_session =  true //false
    let g_user_public = false
    let g_user_public_ccwid = "--"

    const ONE_MEG = Math.pow(2,20)

    let g_current_media_selection = false
    let g_current_file_selection = false
    //
    let manager_window_title = "Media Manager"
    let user_selected_file_op = ""
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    function empty_media(media_obj) {
        if ( media_obj.name === "unknown" ) return true
        if ( media_obj.blob === false || media_obj.size === 0 ) return true
        return false
    }
    //
    async function complete_media_upload() {
        // gather the files being uploaded and send the complete package to storage and publishers.
        manager_window_title = "Media Manager (Finalize Upload)"
        user_selected_file_op = "upload"
        if ( empty_media(g_current_media_selection) ) {
            file_from_db_storage()
        }
        start_floating_window(0)
    }
    async function file_from_db_storage() {
        manager_window_title = "Select Stored File"
        user_selected_file_op = "selection"
        upload_done = false
        nothing_special = true
        g_current_file_selection = false
        g_current_media_selection = {
            name : "unknown",
            size : 0,
            blob : false,
            display_text : "",
            //
            mime_type : "unknown",
            user_picked_type : "unknown",
            type_class : "unknown",
            type_special : "unknown"
        }
        start_floating_window(0)
    }
    async function publish_media(ev) {
        manager_window_title = "Media Manager (PUBLISH)"
        user_selected_file_op = "publish"
        if ( empty_media(g_current_media_selection) ) {
            file_from_db_storage()
        }
        start_floating_window(0)
    }
    async function unpublish_media(ev) {
        manager_window_title = "MM - (Remove Publication)"
        user_selected_file_op = "unpublish"
        if ( empty_media(g_current_media_selection) ) {
            file_from_db_storage()
        }
        start_floating_window(0)
    }
    async function delete_media(ev) {
        manager_window_title = "Media Manager (Delete)"
        user_selected_file_op = "delete"
        if ( empty_media(g_current_media_selection) ) {
            file_from_db_storage()
        }
        start_floating_window(0)
    }
    async function download_media(ev) {
        manager_window_title = "MM - (Retrieve & Download)"
        user_selected_file_op = "download"
        if ( empty_media(g_current_media_selection) ) {
            file_from_db_storage()
        }
        start_floating_window(0)
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    

    async function load_by_type(data_handle,the_file) {
        //
        user_selected_file_op = false
        nothing_special = true
        //
        let type_info = data_handle ? data_handle.substring(0,data_handle.indexOf(';')) : the_file.type
        if ( data_handle ) {
            type_info = type_info.replace('data:','')
        }
        g_current_media_selection.mime_type = type_info
        //
        type_info = type_info.split('/')
        //
        let m_type = "" + g_upload_type
        m_type = m_type.toLocaleLowerCase()
        //
        let special_case = false
        if ( m_type !== type_info[0] ) {
            special_case = type_info[1]
        }
        g_current_media_selection.user_picked_type = m_type
        g_current_media_selection.type_class = type_info[0]
        g_current_media_selection.type_special = type_info[1]
        g_current_media_selection.display_text = data_handle
        //
        switch (m_type) {
            case 'text' : {
                let doctored_text = the_file ? await convert_text(the_file) : data_handle
                if ( !(special_case) || special_case.substring(0,3) !== "svg" ) {
                    text_view = doctored_text
                } else {
                    nothing_special = false
                    special_text = "svg"
                    g_current_media_selection.text_special = special_text
                    svg_text = doctored_text
                }
                g_current_media_selection.display_text = doctored_text
                break
            }
            case 'audio' : {
                if ( audio ) {
                    if ( data_handle === false ) {
                        let [fname,blob] = await drop(false,[the_file])
                        data_handle = blob
                    }
                    paused = true
                    source_link_update = data_handle
                    audio.load()
                    paused = false
                    audio.play()
                }
                break
            }
            case 'video' : {
                if ( data_handle === false ) {      // or substitute a size warning... (size limite custom to type)
                    let [fname,blob] = await drop(false,[the_file])
                    data_handle = blob
                }
                source_link = data_handle
                source = source_link
                poster = poster_link
                show_video = !((source === undefined) || (source.length === 0))
                break
            }
            case 'image' : {
                if ( data_handle === false ) {      // or substitute a size warning... (size limite custom to type)
                    let [fname,blob] = await drop(false,[the_file])
                    data_handle = blob
                }
                avatar = data_handle
                break
            }
            case 'code' : {   /// dtype === application
                let doctored_text = the_file ? await convert_text(the_file) : data_handle
                code_view = doctored_text
                break
            }
        }
    }



    // FILES ENTER INTO THE SYSTEMS
    //
    // ---- onFileSelected
    // ---- dropHandler
	
    // onFileSelected
    async function onFileSelected(e) {
        if ( e.target.files && e.target.files[0] ) {
            g_current_file_selection = e.target.files[0]
            g_current_media_selection = Object.assign(g_current_file_selection)
            //
            g_current_media_selection.upload_type = g_upload_type   // doc type will be stored for later restoration from local storage
            let upload_size = g_current_file_selection.size
            let up_blob = false
            if ( upload_size < (ONE_MEG*60) ) {   /// some arbitrary number for now ... TODO capture slices from large files
                let [fname,blob] = await drop(false,e.target.files)
                g_current_media_selection.blob = blob   // add this (other properties cannot be set)
                up_blob = blob
            } else {
                g_current_media_selection.blob = false
            }
            upload_done = true
            setTimeout(() => {
                load_by_type(up_blob,g_current_file_selection)
            },20)
        }
    }



    function list_selection_response(event) {
        let cmd_obj = event.detail
        if ( cmd_obj.cmd === 'local-selection' ) {
            let file_descr = cmd_obj.file
            g_current_media_selection = file_descr
            g_current_file_selection = file_descr
            user_selected_file_op = 'upload'
            //
            if ( file_descr.blob ) {
                g_upload_type = file_descr.upload_type // set again (unless from the operation window ... then this is it)
                g_current_media_selection.upload_type = g_upload_type   // doc type will be stored for later restoration from local storage
                special_text = g_current_media_selection.text_special
                special_text = (special_text === undefined) ? "" : special_text
                upload_done = true
                setTimeout(() => {
                    load_by_type(file_descr.blob,false)  // file parameter has to be false here
                },20)
            }
        } else if ( cmd_obj.cmd === 'deleted' ) {
            user_selected_file_op = 'selection'
            g_current_media_selection = false
        } else if ( cmd_obj.cmd === 'set-operation' ) {
            user_selected_file_op = cmd_obj.op
        }
	}

    // ---- ---- dropHandler ---- ---- ---- ---- ----
    async function dropHandler(ev) {
        let [fname,blob64] = await dropper(ev)
        avatar = blob64
    }

    // ---- choose_type  ---- Left Side Menu
    //
    function choose_type(m_type) {
        g_current_media_selection = false
        upload_done = false
        nothing_special = true
        switch (m_type) {
            case 'text' : {
                g_upload_type = "Text"
                accepted = file_types.text.join(', ')
                icon_by_type = "../images/text-guess.png"
                break
            }
            case 'audio' : {
                g_upload_type = "Audio"
                accepted = file_types.audio.join(', ')
                icon_by_type ="../images/audio-guess.png"
                break
            }
            case 'video' : {
                g_upload_type = "Video"
                accepted = file_types.video.join(', ')
                icon_by_type = "../images/video-guess.png"
                break
            }
            case 'image' : {
                g_upload_type = "Image"
                accepted = file_types.image.join(', ')
                icon_by_type = "../images/image-guess.png"
                break
            }
            case 'code' : {
                g_upload_type = "Code"
                accepted = file_types.code.join(', ')
                icon_by_type = "../images/code-guess.png"
                break
            }
        }
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----

	let window_scale = { "w" : 0.4, "h" : 0.6 }
	//
	let all_window_scales = []
    all_window_scales = popup_size()

	onMount(async () => {
		//
		window.addEventListener("resize", (e) => {
			//
			let scale = popup_size()
			//
			window_scale.h = scale.h; 
			window_scale.w = scale.w;
            all_window_scales = scale
			//
		})

        window.addEventListener('message', async (e) => {
			const data = e.data;
			const info = JSON.parse(data);
            if ( info.category === undefined ) {
                g_user_public = info
                setTimeout(check_on_session,25)
            }
            
		});

    })

    $: {
        if ( g_user_public.ccwid !== undefined ) {
            g_user_public_ccwid = g_user_public.ccwid
        }
    }

    // ---- ---- ---- ---- ---- ---- ----
    //
    let count_tries = 0
    async function check_on_session() {
        there_is_going_session = true
        //there_is_going_session = await window.session_acquired()
        if ( !there_is_going_session ) {
            count_tries++
            if ( count_tries < 10 ) {
                setTimeout(check_on_session,25)
            }
        } else {
            window.set_global_user_id(g_user_public_ccwid)
        }
    }

</script>

{#if there_is_going_session }
    <div id="app"  on:dragstart={start_drag}  on:drop={dropHandler} on:dragover={dragOverHandler} >

        <div id="top-controls" class="top-controls" >
            <div class="ui-controls-1 dropdown">
                <div class="admin-hover dropdown">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path class="heroicon-ui" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
                    </svg>      
                </div>
                <div class="dropdown-content" >
                    <div id="put-sel-frame-here-sml" class="selected-panel-sml">
                        media type:  {g_upload_type}
                    </div>
                    <ul>
                        {#each list_of_types as media_type }
                            {#if media_type.supported }
                                <li on:click={ () => {choose_type(media_type.type_name)} }>{media_type.type_name}</li>
                            {/if}
                        {/each} 
                    </ul> 
                    <div class="button-list">
                        {#if g_current_media_selection && !(empty_media(g_current_media_selection)) && (user_selected_file_op !== "selection") }
                            <button on:click={complete_media_upload}>Finalize Upload</button>
                        {/if}
                        <button on:click={file_from_db_storage}>Previous Upload</button>
                        <button on:click={publish_media}>Publish</button>
                        <button on:click={unpublish_media}>Pull Out</button>
                        <button on:click={delete_media}>Delete </button>
                        <button on:click={download_media}>Download</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- larger display starts here-->
        <div class="row" >
            <div class="column_1 grad-background" style="text-align:left;vertical-align:top" >
                <div id="put-sel-frame-here" class="selected-panel">
                    media type:  {g_upload_type}
                </div>
                <ul>
                    {#each list_of_types as media_type }
                        {#if media_type.supported }
                            <li on:click={ () => {choose_type(media_type.type_name)} }>{media_type.type_name}</li>
                        {/if}
                    {/each}
                </ul>
                <hr>
                <div class="button-list">
                    {#if g_current_media_selection && !(empty_media(g_current_media_selection)) && (user_selected_file_op !== "selection") }
                    <button on:click={complete_media_upload}>Finalize Upload</button>
                    {/if}
                    <button on:click={file_from_db_storage}>Previous Upload</button>
                    <button on:click={publish_media}>Publish</button>
                    <button on:click={unpublish_media}>Pull Out</button>
                    <button on:click={delete_media}>Delete </button>
                    <button on:click={download_media}>Download</button>
                </div>
            </div>
            <div class="column_2" style="text-align:center">
                {#if g_user_public !== false }
                    <div style="text-align:left;width:90%;font-size:50%;font-weight:bolder">your galactic identity: {g_user_public_ccwid}</div>
                {/if}
                <div style="text-align:center;width:90%;">
                    <h1>Upload {g_upload_type}</h1>
                    {#if !upload_done }
                        <img class="avatar" src="{icon_by_type}" alt="" /> 
                    {:else}
                        {#if (g_upload_type === 'Image') && avatar }
                            <img class="avatar" src="{avatar}" alt="d" />
                        {:else if (g_upload_type === 'Text') }
                            {#if nothing_special }
                                <pre>
                                    {text_view}
                                </pre>
                            {:else if (special_text === 'svg') }
                                {@html svg_text}
                            {/if}
                        {:else if (g_upload_type === 'Code') }
                            {#if business_accepts_code }
                                <pre>
                                <code>
                                    {code_view}
                                </code>
                                </pre>
                            {/if}
                        {:else if (g_upload_type === 'Audio') }
                            <audio controls controlsList="nodownload" 
                                                    bind:this={audio}
                                                    bind:paused  >
                                <source src={source_link_update} type="audio/ogg">
                                <source src={source_link_update} type="audio/mpeg">
                                <source src={source_link_update} type="audio/x-wav">
                                Your browser does not support the audio element.
                                <track kind="captions" />
                            </audio>
                        {:else if (g_upload_type === 'Video') }
                            {#if !(show_video) }
                                <span>no video</span>
                            {:else}
                                <VideoPlayer {source} {poster} calc_source={false} paused={!(isplaying)} />
                            {/if}
                        {/if}
                    {/if}
                </div>
                <div style="text-align:center;width:90%;">
                    <img class="upload" src="{upload_icon}" alt="" on:click={()=>{fileinput.click();}} />
                    <div class="chan" on:click={()=>{fileinput.click();}}>Choose {g_upload_type}</div>
                </div>
                <input style="display:none" type="file" accept="{accepted}" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
            </div>
        </div>

    </div>

    <FloatWindow title={manager_window_title}  index={0} scale_size_array={all_window_scales} >
        {#if g_current_media_selection || (user_selected_file_op === "selection") }
        <FileManager operation={user_selected_file_op} {...g_current_media_selection} file_proper={g_current_file_selection} on:message={list_selection_response} />
        {:else}
        No File Selected
        {/if}
    </FloatWindow>

{:else}
    <span> No user session has been established</span>
{/if}


<style>

    button {
        font-weight: 800;
        font-size: small;
        color:rgb(29, 37, 29);
        border-radius: 9px;
        cursor: pointer;
        max-height: fit-content;
    }
    button:hover {
        background-color: rgb(247, 253, 248);
        color: rgb(71, 148, 71);
    }

    @media screen and (max-width: 690px) {
        .button-list {
            display:flex;
            align-items:left;
            justify-content:left;
            flex-flow:column;
        }
        .selected-panel-sml {
            font-weight: bolder;
            background-color: rgb(251, 249, 230);
            color:rgb(29, 37, 29);
            border-bottom: 1px solid black;
            padding-bottom: 2px;
        }
    }

    @media screen and (min-width: 691px) {
        .button-list {
            display:flex;
            align-items:center;
            justify-content:center;
            flex-flow:column;
        }
        .selected-panel {
            font-weight: bolder;
            background-color: rgb(253, 246, 186);
            color:midnightblue;
            border-bottom: 1px solid midnightblue;
            padding-bottom: 2px;
        }
    }

    pre {
        text-align: justify;
        max-height: 300px;
        overflow-y: auto;
    }


	#app{
	    display:flex;
		align-items:center;
		justify-content:center;
		flex-flow:column;
    }
 
	.upload{
        height:50px;
		width:50px;
		cursor:pointer;
	}
	.avatar{
		height:200px;
		width:200px;
	}
    li {
        font-weight: bolder;
        color:midnightblue;
        cursor: pointer;
    }
    li:hover {
        color:darkolivegreen;
        border-bottom: 1px dotted magenta;
    }

    .grad-background {
        background: -webkit-linear-gradient(to right, rgba(242, 242, 210, 0.3), white);
		background: linear-gradient(to right, rgba(242, 242, 210, 0.3), white );
        border-right: 1px blue solid;
    }


    @media screen and (max-width: 690px) {
        .top-controls {
            width:100%;
            height: 60px;
            text-align: left;
            vertical-align: text-top;
            border-bottom: 1px solid darkslateblue;
        }
    }

    @media screen and (min-width: 691px) {
        .top-controls {
            display:none;
        }
    }


    .ui-controls-1 {
            width: fit-content;
            vertical-align: top;
            display: inline-block;
    }

    .admin-hover {
        box-shadow: 2px 3px rgb(248, 230, 185);
        font-weight: bolder;
        box-shadow: gainsboro;
        text-decoration-line: underline;
        cursor: pointer;
        margin:0px;
    }

    .admin-hover:hover {
        cursor: pointer;
        background-color: rgba(176, 166, 143,0.2);;
        box-shadow: 3px 1px rgb(176, 166, 143);
        text-shadow: 1px 2px 0px #12100b;
        color: rgb(240, 208, 126);
        margin:0px;
    }

    /*  dropdown */
    .dropdown {
        position: relative;
        display: inline-block;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f9f9f9;
        min-width: 200px;
        height:max-content;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        padding: 12px 16px;
        z-index: 1;
        margin-top:0px;
        top: 24px;
    }

    .dropdown:hover .dropdown-content {
        display: grid;
        row-gap: 4px;
        grid-template-columns: auto;
        width: fit-content;
        height: fit-content;
    }


    @media screen and (max-width: 690px) {
        .row {
            width: 100%;
            display: block;
        }
        .column_1 {
            display:none;
        }
        .column_2 {
            width: 100%;
        }
    }

    @media screen and (min-width: 691px) {
        .row {
            width: 100%;
            display: flex;
        }
        .column_1 {
            flex: 20%;
            padding-left:2%;
            padding-right:2%;
        }
        .column_2 {
            flex: 80%;
        }
    }

</style>

 