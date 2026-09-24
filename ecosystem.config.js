module.exports = {
    apps: [
        {
            name: 'my-next-app',
            script: './node_modules/next/dist/bin/next',
            args: 'start -p 3000',
            instances: 'max',       // Utilizes all CPU cores (Cluster mode)
            exec_mode: 'cluster',    // Runs in cluster mode for high availability
            watch: false,            // Do not watch files in production
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
