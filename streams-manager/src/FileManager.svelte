<script>
import { onMount } from "svelte";
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

export let file_proper

let g_all_files = []
let file_selections = []


let current_file = false
let pre_file = false

if ( file_proper ) {
    pre_file = Object.assign({},file_proper)
    for ( let ky in file_proper ) {
        let v = file_proper[ky]
        if ( typeof v !== 'function' ) {
            pre_file[ky] = file_proper[ky]
        }
    }
    console.log(pre_file)
}


let title = ""
let subject = ""
let keys = ""
let abstract = ""
let full_text = ""
let poster = false
let is_paid = false

let field_vars = {}
//
$: {
    field_vars = {
        "rec-file-mtype" : mime_type,
        "rec-title" : title,
        "rec-subject" : subject,
        "rec-keys" : keys,
        "rec-abstract" : abstract,
        "rec-full-text" : full_text,
        "rec-file-name" : name,
        "rec-poster-name" : poster ? poster : "",
        "paid-checkbox" : is_paid,
    }
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


onMount(async () => {
    g_all_files = await window.get_all_user_files()
    file_selections = ([].concat(g_all_files)).map(fname => { return { "name" : fname} } )
})

let selector_box = false
async function open_file_selector(ev,match_mime_type) {
    // match_mime_type --- if provided, then change file selections (otherwise everything)
    if ( !(match_mime_type) ) {
        file_selections = ([].concat(g_all_files)).map(fname => { return { "name" : fname } } )
    } else {
        let subset_files = []
        for ( let fname of g_all_files ) {
            let file = await window.app_get_file(fname)
            if ( file.asset_type === match_mime_type ) {
                subset_files.push(file.name)
            }
        }
        file_selections = subset_files
    }
    /// select from files that have been stored
    selector_box = true
}


async function run_operation(ev,ifop) {
    let selop = operation
    if ( ifop ) {
        selop = ifop
    }
    switch (operation) {
        case "upload" : {
            if ( current_file ) {
                await window.app_run_file_op(current_file,((ifop === undefined ) ? "store" : "update"))
                // process of sending this to the category servers
                if ( ifop ) {
                    await window.create_entry(field_vars)
                } else {
                    await window.update_entry(field_vars)
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
            }
            break;
        }
        case "delete" : {
            if ( current_file ) {
                await window.app_run_file_op(current_file,"delete")
                // request clearning from category servers
                await window.delete_entry(field_vars)
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
        case "remove" : {  // remove from publication
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
}

async function select_file(some_file) {
    close_file_selector()
    name = some_file.name
    let current_file = await window.app_get_file(name)
    if ( current_file ) {
        // dipatch --- tell the app you have a new current file Let it cycle back through svelte
    }
}


</script>
<div class="file-form-presentation last-box">
    <div class = "mat-back mat-back-2 form "  style="white-space:nowrap;height:20px;overflow-x:auto" >
        <span>Operation:</span> 
        {#if (operation !== "selection") } 
            <span>&RightArrowBar;</span><span class="op-name op-action" on:click={run_operation}>{operation}</span>
                {#if (type_class !== 'image') }
                Choose a poster image? <span class="op-name op-action" on:click={(ev) => {open_file_selector(ev,'image')}}>poster</span>
                {/if}
        {:else}
        <span class="op-name op-action" on:click={open_file_selector}>select file</span>
        {/if}
        <div class="file-data">
        <span>Name:</span> {name} <span>Size:</span> {size}
        <span>Mime Type:</span>{mime_type}
        <span>User Selected:</span> {user_picked_type}
        <span>Data Type:</span>{type_class}
        <span>Data Format:</span>{type_special}
        </div>
    </div>
    <div>
        <div class = "mat-back mat-back-2 form "  style="white-space:nowrap;height:35px;overflow-x:auto" >
            <span>User ID: </span><input type="text" id="user-id" > <button id="user-id-btn">User Ready</button>
            <span>Tracking: </span><input type="text" id="user-tracking" >
        </div>
        <div class = "mat-back mat-back-2 form" style="white-space:nowrap;height:35pxoverflow-x:auto">
            <span>Asset ID: </span><input type="text" id="asset-id" >&nbsp;&nbsp;<span style="color:blue;font-size: larger;">&nbsp;&RightArrowBar;&nbsp;</span>
            <span style="color: rgb(6, 32, 6);font-weight: 600;">paid content:</span>&nbsp;&nbsp;<input bind:checked={is_paid} type="checkbox" id="paid-checkbox" />
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
    </div>

    {#if selector_box } 
    <div class="selector-box">
        <div class="sel-box-controls">
            <div style="display:inline-block;float:left;text-align:left;width:fit-content;">
                <button class="sel-box-button" on:click={close_file_selector}>cancel</button>                
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

</style>