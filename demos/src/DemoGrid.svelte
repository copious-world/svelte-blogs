
<script>
import Grid from "svelte-grid";


export let items;
export let cols;
export let rowHeight
//
export let color;
export let entry;
export let title;
export let dates;
export let subject;
export let keys;
export let t_type;
export let txt_full;
export let graphs



let fillFree = true;

function convert_date(secsdate) {
	if ( secsdate === 'never' ) {
		return 'never';
	} else {
		let idate = parseInt(secsdate)
		let dformatted = (new Date(idate)).toLocaleDateString('en-US')
		return (dformatted)
	}
}

let updated_when
let created_when

$: updated_when = convert_date(dates.updated)
$: created_when = convert_date(dates.created)

let short_title
$: short_title = title.substr(0,45)

let descr_on = false;

function handle_readme(ev) {
	descr_on = !descr_on
}



</script>

<div class="container-head">
  <div class="view-ctrl" >
	<button on:click="{handle_readme}">readme</button>
    <input type=checkbox bind:checked={fillFree} />
	  'Fill space' is {fillFree ? 'enabled' : 'disabled'}
   </div>
   <div style="display:inline-block">
    <span style="background-color: {color}">{entry}</span>
		<span style="background-color: yellowgreen">{created_when}</span>
		<span style="background-color: lightblue">{updated_when}</span>
		<span class="blg-item-title" style="background-color: inherit;">{short_title}</span>
   </div>
</div>
<div class="description" style="display: {descr_on ? 'block' : 'none'};" >
	{@html txt_full}
</div>
<Grid bind:items={items} rowHeight={rowHeight} let:item  let:index let:dataItem {cols} fillSpace={fillFree}>
  <div class="content">
		{dataItem.id}
		<div class="graph">{@html graphs[index]}</div>
  </div>
</Grid>


<style>

	span {
		display: inline-block;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		text-align: center;
		border-radius: 0.2em;
		color: white;
	}

	.view-ctrl {
		font-size: 0.80em;
	}

	.view-ctrl button {
		max-height: 25px;
		height: fit-content;
		border-radius: 25px;
	}

	.blg-item-title {
		color:rgb(17, 19, 18);
		display: unset;
		border-bottom: 1px darkslateblue solid;
		font-weight: bold;
	}

	.description {
		border:rgb(64, 2, 90) solid 1px;
		padding: 4px;
		background-color: ghostwhite;
		color: rgb(63, 1, 1);
	}

	.content {
		font-weight: bold;
		height:inherit;
		overflow: auto;
	}

	.graph {
		font-weight: normal;
		color:brown;
		background-color: cornsilk;
	}

	.container-head {
		border-bottom: 2px solid lightsteelblue;
		background-color: rgb(244, 250, 252);
	}

</style>