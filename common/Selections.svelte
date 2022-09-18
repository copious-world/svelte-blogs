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

</style>