<script>

	import {link_picker,picker} from "../../common/link-pick.js"

	// ref ... https://gist.github.com/akirattii/9165836

	// `current` is updated whenever the prop value changes...
	export let dates;
	export let entry;
	export let title;
	export let ucwid;
	export let when;
	export let comment;

	function convert_date(secsdate) {
		if ( secsdate === 'never' ) {
			return 'never';
		} else {
			let idate = parseInt(secsdate)
			let dformatted = (new Date(idate)).toLocaleDateString('en-US')
			return (dformatted)
		}
	}

	let have_comments = false
	let comments = []

	let picked_this = false
	$: picked_this = link_picker.is_picked(entry)

	let updated_when
	let created_when

	$: updated_when = convert_date(dates.updated)
	$: created_when = convert_date(when)

	let going_session = false

	$: if ( comments !== undefined ) {
		if ( typeof window.retrieve_session === "function" ) {
			going_session = window.retrieve_session()
			if ( going_session ) {
				have_comments = Array.isArray(comments) && (comments.length !== 0)
			}
		}
	}
	

	function present_comment_editing() {
		if ( going_session && (typeof window.launch_comment_editor === "function") ) {
			window.launch_comment_editor(going_session,entry)
		}
	}

	function toggle_pick(ev) {
		link_picker.toggle_pick(entry)
		if ( picked_this ) {
			picker.increment()
		} else {
			picker.decrement()
		}
	}

</script>
 
<div class="blg-el-wrapper-full">
	<div style="padding:6px;" >
		<span style="background-color: yellowgreen">{created_when}</span>
		<input type="checkbox" bind:checked={picked_this} on:click={toggle_pick} />
		{#if going_session } 
		<button on:click={present_comment_editing}>add comment</button>
		{/if}
		<h4 class="blg-item-title" style="background-color: inherit;">{title}</h4>
		<h6>{ucwid}</h6>
	</div>
	<div id="blg-window-full-text"  class="full-display" >
		{@html comment}
	</div>
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