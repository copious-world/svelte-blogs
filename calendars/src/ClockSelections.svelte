<script>
	import { createEventDispatcher } from 'svelte';
        
    const dispatch = createEventDispatcher();

    export let time_zone_clocks = []   // currently selected timezones


    let all_tz = Intl.supportedValuesOf('timeZone')
    let tzlist_container = undefined

    let g_selected_clocks = {}

    function selection_save_handler(ev) {
        dispatch('message', {
                "type": 'save-clock-eelections',
                "clocks" : g_selected_clocks
            })
    }

    let tz_set 
    $: tz_set = time_zone_clocks
    function selected_tz(a_tz) {
        let idx = tz_set.indexOf(a_tz)
        return idx > -1
    }


    function handle_checked(ev) {
        let el = ev.target
        if ( el ) {
            let is_checked = el.checked
            g_selected_clocks[el.id] = is_checked
        }
    }


</script>
<!-- begin HTML section-->
<div style="overflow:hidden">
    <div>
        <button on:click={selection_save_handler}>save</button>
    </div>
    <div class="tz_list_container" bind:this={tzlist_container}  >
        <ul>
            {#each all_tz as a_timezone}
                <li>
                    {#if selected_tz(a_timezone) }
                        <input type='checkbox' checked on:change={handle_checked}  id="{a_timezone}" />&nbsp;&nbsp;<span>{a_timezone}</span>
                    {:else}
                        <input type='checkbox' on:change={handle_checked} id="{a_timezone}" />&nbsp;&nbsp;<span>{a_timezone}</span>
                    {/if}
                </li>
            {/each}
        </ul>    
    </div>
</div>
<style>

    div {
        border: blueviolet 1px solid
    }

    button {
        margin-right: 3px;
    }


    .tz_list_container {
        overflow-y:scroll;
        margin: 0px auto;
        position: absolute;
        bottom: 0px;
        width : 100%;
        padding:4px;
        top:80px;
    }

</style>