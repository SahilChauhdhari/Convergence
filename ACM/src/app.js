import { parseCommand } from './commands.js';

const output = document.getElementById('output');
const input = document.getElementById('command-input');

const state = {
    user: 'guest',
    room: 'lobby',
    isAuthorized: false
};

function print(text, type = 'info') {
    const line = document.createElement('div');
    line.className = `line ${type}`;
    line.textContent = text;
    output.appendChild(line);
    window.scrollTo(0, document.body.scrollHeight);
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        print(`${state.user}@nexus:~$ ${cmd}`, 'input');
        parseCommand(cmd, state, print);
        input.value = '';
    }
});

print('NEXUS(TM) OS v4.2.0 - SECURE COMMUNICATION PROTOCOL');
print('Type /help for a list of available commands.');
