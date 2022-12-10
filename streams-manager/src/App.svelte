<script>

    import VideoPlayer from 'svelte-video-player';
    import FloatWindow from 'svelte-float-window';
    import FileManager from './FileManager.svelte';
    //
	import { popup_size } from '../../common/display-utils.js'
    import { onMount } from 'svelte';


    import {file_types, start_drag, dragOverHandler, dropper, drop, convert_text} from '../../common/upload'
    //import frame_messaging from '../../common/human_frame'

    let  avatar, fileinput;

    let text_view = ""
    let code_view = ""
    let svg_text = ""
    let nothing_special = true
    let special_text = ""
     
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

    const ONE_MEG = Math.pow(2,20)


    let g_current_media_selection = false
    let g_current_file_selection = false
    //
    let manager_window_title = "Media Manager"
    let user_selected_file_op = ""
    //
    async function complete_media_upload() {
        // gather the files being uploaded and send the complete package to storage and publishers.
        manager_window_title = "Media Manager (Finalize Upload)"
        user_selected_file_op = "upload"
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
        user_selected_file_op = "pulish"
        start_floating_window(0)
    }
    async function unpublish_media(ev) {
        manager_window_title = "MM - (Remove Publication)"
        user_selected_file_op = "remove"
        start_floating_window(0)
    }
    async function delete_media(ev) {
        manager_window_title = "Media Manager (Delete)"
        user_selected_file_op = "delete"
        start_floating_window(0)
    }
    async function download_media(ev) {
        manager_window_title = "MM - (Retrieve & Download)"
        user_selected_file_op = "download"
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
                let doctored_text = await convert_text(the_file)
                if ( !(special_case) || special_case.substring(0,3) !== "svg" ) {
                    text_view = doctored_text
                } else {
                    nothing_special = false
                    special_text = "svg"
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
                let doctored_text = await convert_text(the_file)
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
            let upload_size = g_current_file_selection.size
            let up_blob = false
            if ( upload_size < ONE_MEG ) {
                let [fname,blob] = await drop(false,e.target.files)
                g_current_media_selection.blob = blob
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
			//
		})
    })

</script>

<div id="app"  on:dragstart={start_drag}  on:drop={dropHandler} on:dragover={dragOverHandler} >
    <table style="width:100%;">
        <tr>
            <td class="grad-background" style="width:10%;text-align:left">
                <ul>
                    <li on:click={ () => {choose_type('text')} }>text</li>
                    <li on:click={ () => {choose_type('audio')} }>audio</li>
                    <li on:click={ () => {choose_type('image')} }>image</li>
                    <li on:click={ () => {choose_type('video')} }>video</li>
                    <li on:click={ () => {choose_type('code')} }>code</li>
                </ul>
                <div class="button-list">
                    {#if g_current_media_selection && (user_selected_file_op !== "selection") }
                    <button on:click={complete_media_upload}>Finalize Upload</button>
                    {/if}
                    <button on:click={file_from_db_storage}>Previous Upload</button>
                    <button on:click={publish_media}>Publish</button>
                    <button on:click={unpublish_media}>Remove</button>
                    <button on:click={delete_media}>Delete </button>
                    <button on:click={download_media}>Download</button>
                </div>
            </td>
            <td style="width:80%;text-align:center" >
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
                            <pre>
                            <code>
                                {code_view}
                            </code>
                            </pre>
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
            </td>
        </tr>
    </table>

</div>

<FloatWindow title={manager_window_title}  index={0} scale_size_array={all_window_scales} >
    {#if g_current_media_selection || (user_selected_file_op === "selection") }
    <FileManager operation={user_selected_file_op} {...g_current_media_selection} file_proper={g_current_file_selection}  />
    {:else}
    No File Selected
    {/if}
</FloatWindow>



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

    .button-list {
	    display:flex;
		align-items:center;
		justify-content:center;
        flex-flow:column;
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
</style>

 