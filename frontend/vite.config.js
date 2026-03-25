export default {
    server: {
        port: 8080,
        proxy: {
            '/api': 'http://localhost:3000',
            '/csrf': 'http://localhost:3000',
        }
    }
}