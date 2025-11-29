import app from '@/app.js';
import 'dotenv/config';
import { containerPromise } from '@/shared/container/container.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
	await containerPromise;

	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

startServer();
