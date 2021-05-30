const mongoose = require('mongoose')
//"mongodb://superAdmin:kR9LrRe22507BdMg@mongodbSubastas:27017/admin"
mongoose
  .connect("mongodb://mongodbSubastas:27017/", {
    user: process.env.MONGO_USER, pass: process.env.MONGO_PASS,
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('mongodb connected.')
  })
  .catch((err) => console.log(err.message))

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to db')
})

mongoose.connection.on('error', (err) => {
  console.log(err.message)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose connection is disconnected.')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  process.exit(0)
})
