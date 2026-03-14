export function parseCommand(input, state, print) {
    const args = input.trim().split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
        case '/help':
            print('Available: /login, /join, /clear, /whoami');
            break;
        case '/clear':
            document.getElementById('output').innerHTML = '';
            break;
        case '/whoami':
            print(`Current user: ${state.user} | Room: ${state.room}`);
            break;
        default:
            print(`Command not found: ${cmd}`, 'error');
    }
}
