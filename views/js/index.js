const listAvailableCommands = {
    "help": 1,
    "clear": 1,
    "switch": 2,
    "show-env": 1,
    "open-database": 1,
    "generate-promo": 1,
    "search-logs": 3 ,
    "view-exception": 2,
    "view-system": 2,
    "view-log": 3
};
const listMode = ["dev", "uat", "preprod"];
let mode = "dev";

document.addEventListener("DOMContentLoaded", function() {
    const commandInput = document.getElementById("commandInput");
    const outputDiv = document.getElementById("output");
    const promptDiv = document.getElementById("prompt");

    commandInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            const command = commandInput.value;
            if (command === "clear") {
                outputDiv.innerHTML = "";
                commandInput.value = "";
                return;
            }

            const output = document.createElement("div");
            output.innerHTML += "\n" + command;
            outputDiv.appendChild(output);

            processCommand(command);
            commandInput.value = "";
        }
    });

    async function processCommand(command) {
        promptDiv.classList.add("hidden");
        let result = await interpretCommand(command);
        const output = document.createElement("div");
        result = result.replaceAll("[]", "<br> ----------------- <br>");
        output.innerHTML += "\n" + result;
        outputDiv.appendChild(output);
        window.scrollTo(0, document.body.scrollHeight);
        promptDiv.classList.remove("hidden");
    }

    async function interpretCommand(command) {
        try {
            command = command.toLowerCase();
            const commandArray = command.split(" ");
            if (commandArray.length === 0 || !(commandArray[0] in listAvailableCommands)) {
                return "Command not recognized. Type 'help' for available commands.";
            }
            if (commandArray.length !== listAvailableCommands[commandArray[0]]) {
                return "Invalid command template. Type 'help' for available commands.";
            }
            if (commandArray[0] === "help") {
                return "<code>List available commands: </code><br>" +
                "<code>--- help : show list command template </code><br>" +
                "<code>--- clear : clear the terminal </code><br>" +
                "<code>--- switch {env} : switch to input env (dev/uat/preprod) </code><br>" +
                "<code>--- show-env : show current env </code><br>" +
                "<code>--- open-database : open database connection </code><br>" +
                "<code>--- generate-promo : generate promo event </code><br>" +
                "<code>--- search-logs {keyword} {file-path} : search from logs </code><br>" +
                "<code>--- view-exception {total-line} : view exception log </code><br>" +
                "<code>--- view-system {total-line} : view system log </code><br>" +
                "<code>--- view-log {total-line} {file-path} : view custom log </code>";
            }
            if (commandArray[0] === "switch") {
                if (!listMode.includes(commandArray[1])) {
                    return "Invalid mode! Please choose dev, uat or preprod.";
                }
                mode = commandArray[1];
                await fetch(`/switch?mode=${mode}`);
                return `Switch to ${mode} environment`;
            }
            mode = await fetchEnv();
            if (commandArray[0] === "show-env") {
                return `Current env: ${mode}`;
            }
            if (confirm(`You are in ${mode} environment. Are you sure to execute this command?`) === false) {
                return "Command is canceled";
            }
            return await fetch("/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ command: commandArray, namespace: mode}),
            }).then((res) => res.text());
        } catch(err) {
            return err.message;
        } 
    }

    async function fetchEnv() {
        try {
            const response = await fetch('/show-env');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.mode;
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error.message);
            return mode;
        }
      }
      
});