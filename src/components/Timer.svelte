<script>
	import {activeTask} from './../store.js';

	const minutesToSeconds = minutes => minutes * 60;
	const secondsToMinutes = seconds => Math.floor(seconds / 60);
	const padWithZeroes = number => number.toString().padStart(2, '0');
	const State = {idle: 'idle', inProgress: 'in progress', resting: 'resting'};

	const POMODORO_S = minutesToSeconds(25);
	const LONG_BREAK_S = minutesToSeconds(20);
	const SHORT_BREAK_S = minutesToSeconds(5);

	let currentState = State.idle;
	let pomodoroTime = POMODORO_S;
	let completedPomodoros = 0;
	let interval;

	const formatTime = (timeInSeconds) => {
		const minutes = secondsToMinutes(timeInSeconds);
		const remainingSeconds = timeInSeconds % 60;
		return `${padWithZeroes(minutes)}:${padWithZeroes(remainingSeconds)}`;
	};

	const startPomodoro = () => {
		currentState = State.inProgress;
		interval = setInterval(() => {
			if (pomodoroTime === 0) {
				completePomodoro();
			}
			pomodoroTime -= 1;
		}, 1000);
	};

	const completePomodoro = () => {
		//clearInterval(interval);
		$activeTask.actualPomodoros++;
		completedPomodoros++;
		if (completedPomodoros === 4) {
			rest(LONG_BREAK_S);
			completedPomodoros = 0;
		} else {
			rest(SHORT_BREAK_S);
		}
	};

	const cancelPomodoro = () => {
		// TODO: Add some logic to prompt the user to write down the cause of cancelling the Pomodoro
		idle();
	};

	const rest = time => {
		currentState = State.resting;
		pomodoroTime = time;
		interval = setInterval(() => {
			if (pomodoroTime === 0) {
				idle();
			}
			pomodoroTime -= 1;
		}, 1000);
	};

	const idle = () => {
		currentState = State.idle;
		clearInterval(interval);
		pomodoroTime = POMODORO_S;
	};
</script>

<section>
	<time>{formatTime(pomodoroTime)}</time>
	<footer>
		<button class="primary" on:click={startPomodoro} disabled={currentState !== State.idle || !$activeTask}>Start</button>
		<button on:click={cancelPomodoro} disabled={currentState !== State.inProgress || !$activeTask}>Cancel</button>
	</footer>
</section>

<style>
  time {
    display: block;
    font-size: 5em;
    font-weight: 300;
    margin-bottom: 0.2em;
  }
</style>