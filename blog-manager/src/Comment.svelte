<script>

	// `current` is updated whenever the prop value changes...
	export let dates;
	export let entry;
	export let title;
	export let txt_full;

	let truncated
	$: truncated = (txt_full !== undefined) ? txt_full.substr(0,250) + "&#8230;" : "search"


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

	$: updated_when = dates ? convert_date(dates.updated) : ""
	$: created_when = dates ? convert_date(dates.created) : ""

	let short_title
	$: short_title = title ? title.substr(0,16) + '...'  : "..."

</script>

<div class="blg-el-wrapper" >
	<span style="color: darkbrown">{entry}</span>
	<span style="background-color: yellowgreen">{created_when}</span>
	<span style="background-color: lightblue">{updated_when}</span>
	<h4 class="blg-item-title" style="background-color: inherit;">{short_title}</h4>
	<div class="teaser">
		{@html truncated}
	</div>	
</div>


<style>

	.blg-el-wrapper {
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

	.teaser {
		margin-top: 3px;
		border-top: 1px solid black;
		font-size: 70%;
		color:rgba(129, 129, 129);
		background-color:rgb(250, 248, 248);
		max-height: 60px;
		overflow-y: hidden;
		text-overflow: ellipsis;
	}


	@media (max-width: 1200px) {
		.teaser {
			max-height: 40px;
		}
	}

	@media (max-width: 1000px) {
		.teaser {
			max-height: 30px;
		}
	}

	@media (max-width: 900px) {
		.teaser {
			max-height: 24px;
		}
	}

	@media (max-width: 700px) {
		.teaser {
			max-height: 20px;
		}
	}

	@media (max-width: 600px) { 
		.teaser {
			max-height: 40px;
		}
	}
</style>