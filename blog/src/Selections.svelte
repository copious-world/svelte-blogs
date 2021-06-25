<script>

	import {link_picker,picker} from "./link-pick.js"

	export let link_picks;

	let count_value;
	const unsubscribe = picker.subscribe(value => {
		count_value = value;
		link_picks = link_picker.get_pick_values()
	});

</script>
 
<div class="blg-el-wrapper-full">
	<ul>
		{#each link_picks as thing (thing.id)}
		<li id="xy_{thing.id}" class="element-poster">
			{thing.title}
		</li>
		{/each}	
	</ul>
</div>

<style>

	.blg-el-wrapper-full {
		overflow-y: hidden;
		height:inherit;
	}
	span {
		display: inline-block;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		text-align: center;
		border-radius: 0.2em;
		color: white;
	}

	.blg-item-title {
		color:black;
		display: unset;
		border-bottom: 1px darkslateblue solid;
	}

	.blg-item-subject {
		color:black;
		display: unset;
	}


	.full-display {
		background-color: rgba(255, 255, 255, 0.9);
		color: rgb(73, 1, 1);
		border-top: solid 2px rgb(88, 4, 88);
		padding: 6px 4px 6px 4px;
		overflow-y: scroll;
		height: 100px;
		border-bottom: solid 1px rgb(88, 4, 88);
	}

	h6 {
		background-color: rgb(245, 245, 245);
		border: 1px black solid;
		border-radius: 0.2em;
		padding: 0.2em 0.5em;
		margin: 0 0.2em 0.2em 0;
		color:black;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 200px;
	}
</style>