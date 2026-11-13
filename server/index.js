// Servidor local de desarrollo. En Vercel se usa api/index.js.
import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => console.log(`AutoPart Pro API escuchando en http://localhost:${env.port}/api`));
