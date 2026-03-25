import cors from 'cors';

const allowedOrigins = [
    'http://localhost:8080',
    'https://christianherrera.dev',
    'https://www.christianherrera.dev',
];

const corsOptions = {
    origin(origin, callback) {
    console.log('CORS origin:', origin);

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'csrf-token'],
};

export default cors(corsOptions);