const mappingTypeWithPath = {
    "view-exception": "var/log/exception.log",
    "view-system": "var/log/system.log",
};
const mappingCommandOfEnv = {
    "dev": `kubectl config use-context ${process.env.DEV_CONTEXT}`,
    "uat":`kubectl config use-context ${process.env.UAT_CONTEXT}`,
    "preprod": `kubectl config use-context ${process.env.PREPROD_CONTEXT}`
}

const getCommand = commandArray => {
    const commandTag = commandArray[0];
    let command = '';
    switch (commandTag) {
        case 'open-database':
            command = [
                'sh',
                '-c',
                'cd pub && curl -s -o health_check.php -L "http://www.adminer.org/latest.php" && supervisorctl restart php-fpm'
            ];
            break;
        case 'generate-promo':
            command = [
                'sh',
                '-c',
                'curl -O https://files.magerun.net/n98-magerun2.phar && chmod +x ./n98-magerun2.phar && php n98-magerun2.phar sys:cron:run sosc_ordering_event_generate_order'
            ];
            break;
        case 'search-logs':
            command = [
                "grep",
                commandArray[1],
                commandArray[2]
            ];
            break;
        default:
            if (commandTag !== 'view-log') {
                commandArray[2] = mappingTypeWithPath[commandTag];
            }
            command = [
                'sh',
                '-c',
                `tail -n ${commandArray[1]} ${commandArray[2]}`
            ];
            break;
    }
    return command;
};

const getSwitchCommand = mode => {
    return mappingCommandOfEnv[mode];
}

module.exports = {
    getCommand,
    getSwitchCommand
}