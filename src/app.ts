import express from 'express'
import cors from 'cors'
import { 
    userRouter
} from './api/components/user/index.ts'
import { 
    subscriptionRouter
} from './api/components/subscription/index.ts'
import { 
    currencyRouter
} from './api/components/currency/index.ts'
import { 
    categoryRouter
} from './api/components/category/index.ts'
/*
Todo: configurar logger como morgan
investigar sobre la mejor manera de manejar errores en express
investigar sobre helmet para seguridad
investigar sobre rate-limiter-flexible para limitar peticiones
y ante todo buscar la buenas practicas y estandares profesionales
de desarrollo con express y typescript
*/
const app = express()
// Middlewares
app.use(cors())
app.use(express.json())

// Routes
const apiBasePath = '/api/v1'
app.use(apiBasePath + '/users', userRouter)
app.use(apiBasePath + '/subscriptions', subscriptionRouter)
app.use(apiBasePath + '/currencies', currencyRouter)
app.use(apiBasePath + '/categories', categoryRouter)

export default app