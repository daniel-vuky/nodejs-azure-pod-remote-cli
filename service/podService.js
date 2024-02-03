const k8s = require('@kubernetes/client-node');
const {PassThrough} = require('stream');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const getEnvironmentVariables = async (namespace) => {
    try {
        const listPods = (await k8sApi.listNamespacedPod(namespace)).body.items;
        let result = [];
        listPods.map(pod => {
            const metadata = pod.metadata;
            const podName = metadata.name;
            if (podName.indexOf('magentoapi') !== -1) {
                const spec = pod.spec;
                const containers = spec.containers;
                if (containers.length === 0) {
                    throw new Error('No containers found');
                }
                const containerName = containers[0].name;
                result.push({ podName: podName, containerName: containerName });
            }
        });
        return result;
    } catch (err) {
        console.error('Error getting environment variables:', err);
    }
}

const execCommand = async (namespace, podName, containerName, command, res) => {
    try {
        const exec = new k8s.Exec(kc);
        const outputStream = new PassThrough();
        await exec.exec(namespace, podName, containerName, command, outputStream, outputStream, outputStream, true, (err, _stream) => {
            if (err) {
                console.log('Executing command:', err);
            }
        });
        // Pipe the PassThrough stream to the response object
        outputStream.pipe(res);
    } catch (err) {
        console.error('Error executing exec command:', err);
    }
}

const getMode = (context) => {
    switch (context) {
        case process.env.UAT_CONTEXT:
            return "dev";
        case process.env.PREPROD_CONTEXT:
            return "preprod";
        default:
            return "dev";
    }
}

module.exports = {
    getEnvironmentVariables,
    execCommand,
    getMode
}