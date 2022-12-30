<script>

import {file_types,drop} from '../../common/upload'
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();//
//
export let operation
export let name
export let size
export let blob
export let display_text
//
export let mime_type
export let user_picked_type
export let type_class
export let type_special

// ---- ---- ---- ---- ---- ---- ---- ----

export let file_proper
let poster_file_proper = false

let poster_accepted = file_types.image.join(', ')

let g_all_files = []
let g_all_files_dirty = true
let file_selections = []

let title = ""
let subject = ""
let keys = ""
let abstract = ""
let full_text = ""
let poster = false
let is_paid = false

let field_vars = {}

let current_file = false   // set either by selection or by beginning an upload...
let pre_file = false

// ---- ---- ---- ---- ---- ---- ---- ----

let poster_selector = false
let poster_box = false
let poster_image = ""
//
let poster_title = ""
let poster_subject = ""

// ---- ---- ---- ---- ---- ---- ---- ----

let o_directory = ""
let been_published = false
let locally_stored = false
let uploaded = false
// ---- ---- ---- ---- ---- ---- ---- ----
let update_operation = "upload"
// ---- ---- ---- ---- ---- ---- ---- ----


$: if ( file_proper ) {
    pre_file = Object.assign({},file_proper)
    for ( let ky in file_proper ) {
        let v = file_proper[ky]
        if ( typeof v !== 'function' ) {
            pre_file[ky] = file_proper[ky]
        }
    }
}

$: if ( pre_file ) {
    current_file = pre_file
}


//
$: {
    field_vars = {
        "rec-file-mtype" : mime_type,
        "rec-title" : title,
        "rec-subject" : subject,
        "rec-keys" : keys,
        "rec-abstract" : abstract,
        "rec-full-text" : full_text,
        "paid-checkbox" : is_paid,
        "rec-file-name" : name,
        "rec-poster-name" : poster ? poster : "",
        "rec-file-proper" : file_proper,
        "rec-poster-proper" : poster_file_proper,
        "rec-original-directory" : o_directory,
        "rec-was-published" : been_published,
        "rec-was-stored" : locally_stored,
        "rec-was-uploaded" : uploaded
    }
}


$: if ( operation === false ) {
    update_operation = "select"
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//


function missing_field(fld_name) {
    alert(`A value in field ${fld_name} is required`)
    return false
}

function values_ready() {
    if ( !(name && name.length) ) return missing_field("name")
    if ( !(keys && keys.length) ) return missing_field("keys")
    if ( !(title && title.length) ) return missing_field("title")
    if ( !(mime_type && mime_type.length) ) return missing_field("mime_type")
    // minimal storage requirement
    return true
}

function value_to_current_file(file_rep) {
    file_rep.mime_type = mime_type
    file_rep.title = title
    file_rep.subject = subject
    file_rep.keys = keys
    file_rep.abstract = abstract
    file_rep.full_text = full_text
    file_rep.is_paid = is_paid
    file_rep.name = name
    file_rep.poster = poster
    file_rep.published = been_published
    file_rep.stored = locally_stored
    file_rep.uploaded = uploaded
    file_rep.original_dir = o_directory
}


function unload_field_vars(field_vars) {
    //
    mime_type = field_vars['rec-file-mtype']
    mime_type = some_def(mime_type)
    title = field_vars['rec-title']
    title = some_def(title)
    subject = field_vars['rec-subject']
    subject = some_def(subject)
    keys = field_vars['rec-keys']
    keys = some_def(keys)
    //
    let abstract = field_vars['rec-abstract']
    abstract = some_def(abstract)
    let full_text = field_vars['rec-full-text']
    full_text = some_def(full_text)
    is_paid = field_vars['paid-checkbox']
    is_paid = some_def_bool(is_paid)
    //
    name = field_vars['rec-file-name']
    name = some_def(name)
    //
    been_published = field_vars['rec-was-published']
    locally_stored = field_vars['rec-was-store']
    uploaded = field_vars['rec-was-uploaded']
    //
    o_directory = field_vars['rec-o-directory']
    o_directory = some_def(o_directory)
    //
    if ( title.length === 0 ) title = name
    //
    let file_proper = field_vars['rec-file-proper']
    current_file.blob = file_proper.blob_url
    //
    poster = field_vars['rec-poster-name']
    poster = some_def(poster)
    let poster_file_proper = field_vars['rec-poster-proper']
    //
    if ( poster && poster.length ) {
        if ( poster_file_proper ) {
            poster_box = true
            poster_image = poster_file_proper.blob_url
        }
    }
}


async function current_file_to_vars(file_rep) {
    mime_type = file_rep.mime_type
    mime_type = some_def(mime_type)
    title = file_rep.title
    title = some_def(title)
    subject = file_rep.subject
    subject = some_def(subject)
    keys = file_rep.keys
    keys = some_def(keys)
    abstract = file_rep.abstract
    abstract = some_def(abstract)
    full_text = file_rep.full_text
    full_text = some_def(full_text)
    is_paid = file_rep.is_paid
    is_paid = some_def_bool(is_paid)
    name = file_rep.name
    name = some_def(name)
    if ( title.length === 0 ) title = name
    poster = file_rep.poster
    poster = some_def(poster)
    if ( poster && poster.length ) {
        let p_file = await window.app_get_file(poster)
        if ( p_file ) {
            let some_file = p_file.data
            poster_box = true
            poster_image = some_file.blob
            poster = some_file.name
            poster_file_proper = some_file
        }
    }
    been_published = file_rep.published ? true : false
    locally_stored = file_rep.stored ? true : false
    uploaded = file_rep.uploaded ? true : false
    o_directory = file_rep.original_dir
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

async function load_file_list() {
    if ( g_all_files_dirty ) {
        g_all_files_dirty = false
        g_all_files = await window.get_all_user_files()
        file_selections = ([].concat(g_all_files)).map(fname => { return { "name" : fname} } )
    }
}

let selector_box = false
async function open_file_selector(ev,match_mime_type,from_poster) {
    poster_selector = false
    await load_file_list()
    // match_mime_type --- if provided, then change file selections (otherwise everything)
    if ( !(match_mime_type) ) {
        file_selections = ([].concat(g_all_files)).map(fname => { return { "name" : fname } } )
    } else {
        let subset_files = []
        for ( let fname of g_all_files ) {
            let file = await window.app_get_file(fname)
            let base_type = file.data.type.split('/')[0]
            if ( base_type === match_mime_type ) {
                subset_files.push(file.data)
            }
        }
        file_selections = subset_files
        if ( (match_mime_type === "image") && from_poster ) {
            poster_selector = true
        }
    }
    /// select from files that have been stored
    selector_box = true
}


async function run_operation(ev,ifop,local_only) {
    let selop = operation
    if ( ifop ) {
        selop = ifop
    }
    switch (operation) {
        case "upload" : {
            if ( current_file ) {
                if ( values_ready() ) {
                    value_to_current_file(current_file)
                    current_file.stored = true
                    current_file.uploaded = true
                    //
                    if ( local_only ) {
                        current_file.blob = blob
                    }
                    //
                    await window.app_run_file_op(current_file,((ifop === undefined ) ? "store" : "update"))
                    // process of sending this to the category servers
                    if ( !local_only ) {
                        if ( !(ifop) ) {
                            await window.create_entry(field_vars)
                        } else {
                            await window.update_entry(field_vars)
                        }                    
                    }
                    locally_stored = current_file.stored
                    uploaded = current_file.uploaded
                    g_all_files_dirty = true
                }
            }
            break;
        }
        case "download" : {
            if ( current_file ) {
                await select_file(current_file)
                // request retrieval from category servers
                await window.get_entry(field_vars)
                // unload field_vars  --- dispatch
                unload_field_vars(field_vars)
            }
            break;
        }
        case "delete" : {
            if ( current_file ) {
                await window.app_run_file_op(current_file,"remove")
                // request clearning from category servers
                if ( current_file.uploaded ) {
                    await window.delete_entry(field_vars)
                }
                g_all_files_dirty = true
                title = ""
                await load_file_list()  /// might be open already
                clear_finalization()
            }
            break;
        }
        //
        case "publish" : {
            if ( current_file ) {
                current_file.published = true
                await run_operation(false,"upload")
                await window.publish_entry(field_vars)
            }
            break;
        }
        case "unpublish" : {  // remove from publication
            if ( current_file ) {
                current_file.published = false
                await run_operation(false,"upload")
                await window.unpublish_entry(field_vars)
            }
            break;
        }
    }
}

function close_file_selector(ev) {
    selector_box = false
    poster_selector = false
}

function close_poster_view(ev) {
    poster_box = false
}


function select_operation(ev) {
    dispatch('message', {
			'cmd': 'set-operation',
			'op' : update_operation
		});
}

function selection_to_global(selected_file) {
    dispatch('message', {
			'cmd': 'local-selection',
			'file' : selected_file
		});
}

function clear_finalization() {
    dispatch('message', {
			'cmd': 'deleted'
		});
}


async function select_file(some_file) {
    let cur_file = await window.app_get_file(some_file.name)
    if ( cur_file ) {
        if ( poster_selector ) {
            poster_box = true
            poster_image = some_file.blob
            poster = some_file.name
            poster_file_proper = some_file
        } else {
            name = some_file.name
            current_file = cur_file.data
            current_file_to_vars(current_file)
            selection_to_global(current_file)
            update_operation = "select"
        }
        close_file_selector()
    }
}

let posterinput = false

async function onPosterSelected(e) {
    if ( e.target.files && e.target.files[0] ) {
        g_all_files_dirty = true
        poster_file_proper = e.target.files[0]            //
        let upload_size = poster_file_proper.size
        let [fname,blob] = await drop(false,e.target.files)
        poster_file_proper.blob = blob
        poster_box = true
        poster_image = blob
        poster = fname
        close_file_selector(e)
        //
        let current_poster_file = {}
        //
        current_poster_file = Object.assign({},poster_file_proper)
        for ( let ky in poster_file_proper ) {
            let v = poster_file_proper[ky]
            if ( typeof v !== 'function' ) {
                current_poster_file[ky] = poster_file_proper[ky]
            }
        }
        //
        await window.app_run_file_op(current_poster_file, "store")
    }
}


</script>
<div class="file-form-presentation last-box">
    <div class = "mat-back mat-back-2 form "  style="white-space:nowrap;height:20px;overflow-x:auto" >
        <span>Operation:</span> 
        {#if (operation !== "selection") }
            {#if operation === false }
                <span>&RightArrowBar;</span>
                <select class="op-selector" bind:value={update_operation} on:change={select_operation}>
                    <option value="select">select</option>
                    <option value="upload">upload</option>
                    <option value="publish">publish</option>
                    <option value="remove">remove</option>
                    <option value="delete">delete</option>
                    <option value="download">download</option>
                  </select>
            {:else}
                <span>&RightArrowBar;</span><span class="op-name op-action" on:click={run_operation}>{operation}</span>
                {#if (operation === "upload") }
                Upload later? <span class="op-name op-action" on:click={(ev) => {run_operation(ev,false,true)}}>store</span>
                {/if}
            {/if}
        {:else}
        <span class="op-name op-action" on:click={open_file_selector}>select file</span>
        {/if}
        <div class="file-data">
        <span>Name:</span> {name} <span>Size:</span> {size}
        <span>Mime Type:</span> {mime_type}
        <span>User Selected:</span> {user_picked_type}
        <span>Data Type:</span> {type_class}
        <span>Data Format:</span> {type_special}
        </div>
    </div>
    <div>
        <div class = "mat-back mat-back-2 form" style="white-space:nowrap;height:35pxoverflow-x:auto">
            <span>Asset ID: </span><input type="text" id="asset-id" >&nbsp;&nbsp;<span style="color:blue;font-size: larger;">&nbsp;&RightArrowBar;&nbsp;</span>
            <span style="color: rgb(6, 32, 6);font-weight: 600;">paid content:</span>&nbsp;&nbsp;<input bind:checked={is_paid} type="checkbox" id="paid-checkbox" />
            {#if (type_class !== 'image') }
            &nbsp;&nbsp;<span style="color:blue;font-size: larger;">&nbsp;&RightArrowBar;&nbsp;</span>
            Choose a poster image? <span class="op-name op-action" on:click={(ev) => {open_file_selector(ev,'image',true)}}>poster</span>
            {/if}    
        </div>
    </div>
    <div class = "mat-back" >
        <div class = "mat-back-2" >
            <div class = "form" >
                <div class = "field">
                    <label for="rec-title">Title:</label> <input bind:value={title} id="rec-title" type="text" class="text-field" />
                </div>
                <div class = "field">
                    <label for="rec-subject">Subject:</label> <input  bind:value={subject} id="rec-subject" type="text" class="text-field" />
                </div>
                <div class = "field">
                    <label for="rec-keys" >Keys:</label> <input bind:value={keys} id="rec-keys" type="text"class="text-field"  />
                </div>
                <div class = "field">
                    <label for="rec-abstract" >Abstract:</label>
                    <textarea bind:value={abstract}  id="rec-abstract" class="text-field"  ></textarea>  
                </div>
                <div id="when-loading-blog-text" class="field" style="visibility: hidden;display:none;">
                    <label for="rec-full-text" >Full Text:</label>
                    <textarea bind:value={full_text} id="rec-full-text"  class="text-field"  ></textarea>  
                </div>
                <div id="when-loading-stream" class = "field">
                    <span >Media File:</span> {name}
                </div>
                <div class = "field">
                    <span>Poster Image:</span> {poster}
                </div>
            </div>
        </div>
        <div class = "mat-back-2" >
            <div class = "form" >
                <span style="color:cadetblue;text-decoration:wavy">Fields stored locally for you convenience:</span>
                <span style="color:blue;font-size: larger;">&nbsp;&RightArrowBar;&nbsp;</span>
                {#if been_published }
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Published</span>
                {:else}
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Not Published</span>
                {/if}
                {#if locally_stored }
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Stored</span>
                {:else}
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Not Stored</span>
                {/if}
                {#if uploaded }
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Uploaded</span>
                {:else}
                <span style="color: rgb(6, 32, 6);font-weight: 600;">Not Uploaded</span>
                {/if}
                <div class = "field">
                    <label for="rec-title">Original Directory:</label> <input bind:value={o_directory} id="rec-directory" type="text" class="text-field" />
                </div>
            </div>
        </div>
    </div>

    {#if selector_box } 
    <div class="selector-box">
        <div class="sel-box-controls">
            <div style="display:inline-block;float:left;text-align:left;width:fit-content;">
                <button class="sel-box-button" on:click={close_file_selector}>cancel</button>
                {#if poster_selector }
                <span> upload poster: </span><input type="file" accept="{poster_accepted}"  style="font-size: xx-small;cursor:pointer;"  on:change={(e)=>onPosterSelected(e)} bind:this={posterinput} >
                {/if}
            </div>
            <div style="display:inline-end;float:unset;text-align:center;width:auto;padding-top:4px;">
                <span>Select a file</span>
            </div>
        </div>
        <div class="file-list-container">
            <ol>
            {#each file_selections as afile }
                <li class="li-select" on:click={() => { select_file(afile) } }>{afile.name}</li>
            {/each}
            </ol>
        </div>
    </div>
    {/if}

    {#if poster_box } 
    <div class="selector-box">
        <div class="sel-box-controls">
            <div style="display:inline-block;float:left;text-align:left;width:fit-content;">
                <button class="sel-box-button" on:click={close_poster_view}>OK</button>
            </div>
            <div style="display:inline-end;float:unset;text-align:center;width:auto;padding-top:4px;">
                <span>Poster Choice</span>
            </div>
        </div>
        <div class="poster-view-container">
            <div>
                <span>{poster_title}</span><br>
                <span>{poster_subject}</span>    
            </div>
            <div>
                <img class="poster" src="{poster_image}" alt="d" />
            </div>
        </div>
    </div>
    {/if}

</div>
<style>

    span {
        font-weight: bold;
    }

    .op-name {
        color:seagreen;
        font-size: 120%;
    }

    .op-action {
        border: solid 1px darkolivegreen;
        border-radius: 4px;
        font-size: 110%;
        padding-left:3px;
        padding-right:3px;
    }
    .op-action:hover {
        color:darkgreen;
        background-color: bisque;
        cursor: pointer;
    }
    .op-action:active {
        color: bisque;
        background-color: darkgreen;
    }

    .file-data {
        display: inline-block;
        font-size: x-small;
        border: solid 1px greenyellow;
        background-color: ghostwhite;
    }

    button {
      cursor: pointer;
      font-size: 101%;
      font-weight: bold;
      color: darkblue;
      margin: 2px;
      width:120px;
    }

    button:hover {
      background-color : #CACAFF;
      color: darkred;
    }

    .mat-back {
      padding:2px;
      border: solid 1px rgb(80, 2, 80);
      background-color: rebeccapurple;
    }
    .mat-back-2 {
      padding: 6px;
      border: solid 1px rgb(41, 156, 147);
      background-color: snow;
    }

    label {
      font-weight: bold;
    }

    .field {
      padding : 4px;
      border: solid 1px rgb(253, 253, 253);
      display: block;
      visibility: visible;
    }

    .file-form-presentation {
        font-size: 86%;
    }

    .text-field {
        width : 80%
    }

    .last-box {
        position: absolute;
        bottom: 0px;
        top:52px;
        width:100%;
        overflow-y: scroll;
    }

    .selector-box {
        position: absolute;
        right:0px;
        left:30%;
        top:0px;
        bottom:0px;
        overflow-y: auto;
        background-color: white;
        border:solid 1px purple;
    }

    .sel-box-button {
        font-size: xx-small;
    }

    .sel-box-controls {
        height: 25px;
        width:100%;
        background-color: rgb(249, 249, 233);
        border-bottom: 1px solid navy;
        vertical-align: middle;
    }

    .file-list-container {
        position: absolute;
        bottom:0px;
        top: 25px;
        overflow-y: scroll;
        width:98%;
    }

    .poster-view-container {
        position: absolute;
        bottom:0px;
        top: 25px;
        overflow-y: scroll;
        width:98%;
    }
    .li-select {
        cursor: pointer;
        color: darkblue;
        font-weight: 800;
    }
    .li-select:hover {
        color:orangered;
    }
    .li-select:active {
        color:greenyellow;
    }

	.poster {
		height:200px;
		width:200px;
	}

    .op-selector {
        font-weight: bold;
        height: 24px;
        font-size: 75%;
    }
</style>