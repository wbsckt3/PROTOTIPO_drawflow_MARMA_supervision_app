module.exports = {
  apps: [{
    name: "marma",
    script: "server.js",
    env: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://techguardtenant_atlas_user:p7HgNMurjp6J8PVC@cluster0.rlmhoii.mongodb.net/saas_platform?retryWrites=true&w=majority&appName=Cluster0'
    }
  }]
}
