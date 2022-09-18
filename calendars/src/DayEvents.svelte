<script>
export let day
export let month
export let ev_list

let ev_list_keys = []
$: ev_list_keys = Object.keys(ev_list)

</script>
<div>
<h3>{month}/{day}</h3>
<div>
    <div> events </div>
    <div>
        {#each ev_list_keys as ev_key}
        <div>
            {ev_key} :: {ev_list[ev_key]}
        </div>
        {/each}
    </div>
</div>
</div>
<style>
    div { 
        border : solid 1px black;
    }
</style>

