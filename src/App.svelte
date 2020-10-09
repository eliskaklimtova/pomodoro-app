<script>
	import TaskList from './components/TaskList.svelte';
	import Timer from './components/Timer.svelte';

	let title = 'Pomodoro Timer';
	let activeTask;

	const updateActiveTask = event => {
		activeTask = event.detail.task;
	};
</script>

<main>
	<h1>{title}</h1>
	<Timer {activeTask}/>
	<TaskList on:taskSelected={updateActiveTask}/>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: var(--accent);
		text-transform: uppercase;
		font-size: 6em;
		margin-bottom: 5rem;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>