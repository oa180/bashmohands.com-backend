import app from './src/app.js';
import { config } from 'dotenv';

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

config({ path: '.env' });

// Port Number
const port = process.env.PORT || 8080;

// Starting Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
