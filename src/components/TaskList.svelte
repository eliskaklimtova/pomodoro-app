<script>
	import { afterUpdate } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import {activeTask} from './../store.js';
	import {Task} from './../Task.js';
	
	const dispatch = createEventDispatcher();

	let taskPendingFocus = false;
	let lastInput;
	
	let tasks = [];

	$: allExpectedPomodoros = tasks.reduce((acc, t) => acc + t.expectedPomodoros, 0);

	const addTask = () => {
		tasks = tasks.concat(new Task());
		taskPendingFocus = true;
	};

	const removeTask = task => {
		const index = tasks.indexOf(task);
		if ($activeTask === task) {
			selectTask(undefined);
		}
		tasks = [...tasks.slice(0, index), ...tasks.slice(index + 1)];
	};

	const selectTask = task => {
		$activeTask = task;
	};

	const focusNewTask = () => {
		if (taskPendingFocus && lastInput) {
			lastInput.focus();
			taskPendingFocus = false;
		}
	};

	afterUpdate(focusNewTask);
</script>

{#if tasks.length === 0}
	<h3>You haven't added any tasks yet.</h3>
{:else}
	<ul>
		{#each tasks as task}
			<li class:active={$activeTask === task}>
				<button class="select-task" on:click={() => selectTask(task)}></button>
				<input class="description" type="text" bind:value={task.description} bind:this={lastInput}>
				<input class="pomodoros" type="number" bind:value={task.expectedPomodoros}>
				<input class="pomodoros small" bind:value={task.actualPomodoros} disabled>
				<button on:click={removeTask(task)}>Delete</button>
			</li>
		{/each}
	</ul>
{/if}

<button class="primary" on:click={addTask}>Add task</button>

{#if tasks.length !== 0}
	<h3>Today you will complete {allExpectedPomodoros} pomodoros.</h3>
{/if}

<style>
	ul {
		list-style: none;
	}
	.active input,
  .active button {
    border-color: var(--accent);
    background-color: var(--accent);
    color: white;
		transition: background-color .2s, color .2s, border-color .2s;
		opacity: 0.6;
	}
	.select-task {
		border-radius: 50px;
		vertical-align: middle;
	}
	.description {
		min-width: 400px;
	}
	.pomodoros { 
		max-width: 100px;
	}
	.pomodoros.small { 
  max-width: 40px;
  text-align: center;
	}
	.active input[disabled] {
		opacity: 0.3;
	}
</style>