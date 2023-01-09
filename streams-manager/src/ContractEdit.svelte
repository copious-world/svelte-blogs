<script>

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();//
//

export let contract_view = {
    "name" : "",
    "_tracking" : "",
    "producers" : {},
    "authors" : {}
}

export let user_identity = ""

let name = ""
let name_entry = ""
let edit_mode = "editing"


let payout_entries_producers = []
let payout_entries_authors = []

$: name = contract_view.name
let enter_name = false
$: if ( !(name) || ((typeof name === 'string') && (name.length === 0)) ) {
    enter_name = true
    name = ""
}

$: contract_view.name = name_entry

$: {
    //
    if ( contract_view.authors === undefined ) {
        contract_view.authors = {}
    }
    if ( contract_view.producers === undefined ) {
        contract_view.producers = {}
    }
    //
    let payouts_a = Object.keys(contract_view.authors)
    let payouts_p = Object.keys(contract_view.producers)
    payout_entries_authors = payouts_a.map( aky => { contract_view.authors[aky] })
    payout_entries_producers = payouts_p.map( aky => { contract_view.producers[aky] })
    //
}

let tracking = "--"
$: if ( (typeof contract_view._tracking === 'string') ) {
    tracking = contract_view._tracking
}


// svelte weirdness
let authors_changed = true
let producers_changed = true
//
let percent_lock = true
//
function add_author(ev) {
    //
    let payouts = payout_entries_authors.concat([
        {
            "name" : "",
            "role" : "",
            "percent" : 0,
            "wallet" : "",
            "_i" : 0
        }
    ])
    let n = payouts.length
    for ( let i = 0; i < n; i++ ) {
        payouts[i]._i = i
    }
    //
    payout_entries_authors = payouts
}

//  ---- remove_authors
function remove_authors(ev) {
    authors_changed = false
    //
    let payouts = payout_entries_authors.filter(payout => {
        let i = payout._i
        let el = document.getElementById(`auth-${i}`)
        return el ? !(el.checked) : false
    })
    //
    let n = payouts.length
    for ( let i = 0; i < n; i++ ) {
        let p = payouts[i]
        p._i = i
    }
    //
    payout_entries_authors = payouts
    setTimeout(() => { set_percentages('a',payout_entries_authors) }, 5)  // let half a second go by before correcting p values
}

function add_producer(ev) {
    //
    let payouts = payout_entries_producers.concat([
        {
            "name" : "",
            "role" : "",
            "percent" : 0,
            "wallet" : "",
            "_i" : 0
        }
    ])
    let n = payouts.length
    for ( let i = 0; i < n; i++ ) {
        payouts[i]._i = i
    }
    payout_entries_producers = payouts
}

//  ---- remove_producers
function remove_producers(ev) {
    producers_changed = false
    //
    let payouts = payout_entries_producers.filter(payout => {
        let i = payout._i
        let el = document.getElementById(`producer-${i}`)
        return el ? !(el.checked) : false
    })
    //
    let n = payouts.length
    for ( let i = 0; i < n; i++ ) {
        let p = payouts[i]
        p._i = i
    }
    //
    payout_entries_producers = payouts
    setTimeout(() => { set_percentages('p',payout_entries_producers) }, 5)  // let half a second go by before correcting p values
}

// update_name
function update_name(entry,value) {
    entry.name = value
}
function update_role(entry,value) {
    entry.role = value
}
function update_percentage(type,entry,value) {
    entry.percent = value
    let percent_update_array = (type === 'a') ? payout_entries_authors : payout_entries_producers
    setTimeout(() => { set_percentages(type,percent_update_array) }, 5)  // let half a second go by before correcting p values
}
function update_wallet(entry,value) {
    entry.wallet = value
}

function set_percentages(type,percent_update_array) {
    if ( type === 'a' ) {
        authors_changed = false
    } else {
        producers_changed = false
    }
    if ( percent_lock ) {
        // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        let n = percent_update_array.length
        let total = 0
        for ( let entry of percent_update_array ) {
            total += parseInt(entry.percent)
        }
        let factor = 100.00/total
        for ( let entry of percent_update_array ) {
            let p = parseFloat(entry.percent)
            entry.percent = p*factor
        }
    }
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    setTimeout(() => {
        if ( type === 'a' ) {
            authors_changed = true
        } else {
            producers_changed = true
        }
    },5)
}

function finalize_percentages(type) {
    let percent_update_array = type === 'a' ? payout_entries_authors : payout_entries_producers
    set_percentages(type,percent_update_array) 
}

</script>

<div class="edit-contract-presentation">
    <div class="contact-controls">
        <span class="contract-mode">Edit mode:</span>&nbsp;<span>{edit_mode}</span>
        &nbsp;::&nbsp;
        {#if !enter_name }
        <span class="contract-mode">name:</span>&nbsp;<span>{name}</span>
        {:else}
        <span class="contract-mode">enter name:</span>&nbsp;<input type="text" bind:value={name_entry}/>
        {/if}
        <span class="contract-mode">Contract Manager:</span>&nbsp;<span>{user_identity}</span>
        <span style="font-style:italic;font-size:xx-small">tracking: {tracking}</span>
    </div>
    <div class="contact-parts"><span>Authors</span> <span class="edit-button" on:click={add_author}>+</span> <span class="edit-button" on:click={remove_authors} >-</span> 
        {#if percent_lock }
        <span class="edit-button-small" on:click={() => {percent_lock = false} }>% figure</span>
        {:else}
        <span class="edit-button-small" on:click={() => {percent_lock = true; finalize_percentages('a')} }>% enter</span>
        {/if}
    </div>
    <div class="row-keeper">
        {#if authors_changed }
        {#each payout_entries_authors as entry }
            <div class="entry-line">
                <div class="line-of-values" >
                    <div class="one-value-field" >
                        <span>Author: </span><input type="text" value={entry.name} on:change={(ev)=>{update_name(entry,ev.target.value)}} />
                    </div>
                    <div class="one-value-field" >
                        <span>Role: </span><input class="role-field" type="text" value={entry.role} on:change={(ev)=>{update_role(entry,ev.target.value)}} />
                    </div>
                    <div class="one-value-field" >
                        <span>Percentage: </span><input class="num-percent" type="number" min="0" max="100" value={entry.percent} on:change={(ev)=>{update_percentage('a',entry,ev.target.value)}} />
                    </div>
                    <div class="one-value-field" >
                        <span>Crypto Wallet: </span><input type="text" value={entry.wallet} on:change={(ev)=>{update_wallet(entry,ev.target.value)}} /> 
                    </div> 
                    <div class="one-value-field" >
                        <input type="checkbox" id="auth-{entry._i}" />
                    </div>
                </div>
            </div>
        {/each}
        {/if}
    </div>
    <div class="contact-parts" ><span>Producers</span> <span class="edit-button"  on:click={add_producer} >+</span> <span class="edit-button" on:click={remove_producers} >-</span>
        {#if percent_lock }
        <span class="edit-button-small" on:click={() => {percent_lock = false} }>% figure</span>
        {:else}
        <span class="edit-button-small" on:click={() => {percent_lock = true; finalize_percentages('p') } }>% enter</span>
        {/if}
    </div>
    <div class="row-keeper">
        {#if producers_changed }
        {#each payout_entries_producers as entry }
            <div class="entry-line">
                <div class="line-of-values" >
                    <div class="one-value-field" >
                        <span>contributor: </span><input type="text" value={entry.name} on:change={(ev)=>{update_name(entry,ev.target.value)}}  />
                    </div>
                    <div class="one-value-field" >
                        <span>Role: </span><input class="role-field" type="text" value={entry.role} on:change={(ev)=>{update_role(entry,ev.target.value)}} />
                    </div>
                    <div class="one-value-field" >
                        <span>Percentage: </span><input class="num-percent" type="number" min="0" max="100" value={entry.percent} on:change={(ev)=>{update_percentage('p',entry,ev.target.value)}}/>
                    </div>
                    <div class="one-value-field" >
                        <span>Crypto Wallet: </span><input type="text" value={entry.wallet} on:change={(ev)=>{update_wallet(entry,ev.target.value)}} />
                    </div>
                    <div class="one-value-field" >
                        <input type="checkbox" id="producer-{entry._i}" />
                    </div>
                </div>
            </div>
        {/each}
        {/if}
    </div>
</div>

<style>

    span {
        font-weight: bold;
    }

    .contact-controls {
        text-align: left;
        border: solid 1px navy;
        padding-left: 8px;
        background-color: rgb(240, 245, 245);
    }

    .contact-parts {
        text-align: center;
        border: solid 1px navy;
        padding-left: 8px;
        background-color: rgb(242, 245, 240);
    }

    .contract-mode {
        color: darkblue;
    }

    .line-of-values {
        display: inline-block;
    }

    .entry-line {
        text-align: left;
        border-bottom: 1px solid rgb(37, 47, 37);
    }

    .row-keeper {
        max-height: 300px;
        max-width: calc(90vw - 60px);
        overflow: scroll;
    }
 
    .edit-contract-presentation {
        font-size: 86%;
        min-height: 300px;
        margin-top: 4px;
        margin-bottom: 6px;
    }

    .one-value-field {
        display: inline-block;
    }

    .num-percent {
        width:60px;
    }

    .role-field {
        width:100px;
    }

    .edit-button {
      cursor: pointer;
      font-size: 200%;
      font-weight: bold;
      color: darkblue;
      margin: 1px;
      width:fit-content;
      height: 16px;
    }

    .edit-button-small {
        cursor: pointer;
        font-size: 90%;
        font-weight: bold;
        color: darkblue;
        margin: 1px;
        width:fit-content;
        height: 16px;
    }

    .edit-button:hover {
      background-color : #CACAFF;
      color: darkred;
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

</style>