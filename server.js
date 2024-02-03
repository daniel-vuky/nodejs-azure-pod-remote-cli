const dotenv = require('dotenv').config();
const express = require('express');
const podService = require('./service/podService');
const commandService = require('./service/commandService');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);


const app = express();
const port = process.env.SERVER_PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/execute', async (req, res) => {
    try {
        // Set content type to indicate that we are sending plain text data
        res.setHeader('Content-Type', 'text/plain');

        const { namespace, command } = req.body;

        const listEnvVariables = await podService.getEnvironmentVariables(namespace);
        const convertedCommand = commandService.getCommand(command);
        const commandTag = command[0];

        if (commandTag === 'open-database') {
            listEnvVariables.map(async (env) => {
                let { podName, containerName } = env;
                await podService.execCommand(namespace, podName, containerName, convertedCommand, res);
            });
            res.send('Database setup has been triggered, it might need about 10-15s to finish. You can access db by browser after this time!');
            return;
        }

        let { podName, containerName } = listEnvVariables[0];
        await podService.execCommand(namespace, podName, containerName, convertedCommand, res);
    } catch (err) {
        console.error('Error executing exec command:', err);
        res.status(500).send('Error executing exec command');
    }
});
app.get('/switch', async (req, res) => {
    try {
        const command = commandService.getSwitchCommand(req.query.mode);
        await exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`stderr: ${stderr}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
        });
        res.send('Switched to new environment!');
    } catch (err) {
        console.error('Error executing exec command:', err);
        res.status(500).send('Error executing exec command');
    }
});
app.get('/show-env', async (req, res) => {
    try {
        const { stdout, stderr } = await execPromise('kubectl config current-context');
        if (stderr) {
            throw new Error(stderr);
        }
        res.status(200).json({ mode: podService.getMode(stdout.trim()) });
    } catch (err) {
        console.error('Error executing exec command:', err);
        res.status(500).send('Error executing exec command');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});