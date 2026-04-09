// npm install vuex@next --save

import { createStore } from 'vuex'
export default createStore({
  state: {
    // Your initial application state goes here
    auth: { // Authentication state
      loggedIn: false,
      user: null,
      roles: [
        { name: 'Configuraciones' },
        { name: 'Admin' },
        { name: 'User' },
        { name: 'Guest' },
        { name: 'Rips_interno' }
      ] // Initially an empty array
    },
    // ... other state properties
  },
  mutations: {
    // ... other mutations
    SET_USER(state, user) { // Mutation to set the user and roles
      state.auth.loggedIn = true;
      state.auth.user = user;
      state.auth.roles = user.roles; // Set roles from the user object
    },
    // ... other mutations
  },
  actions: {
    // ... other actions
    login({ commit }, credentials) { // Login action
      return new Promise((resolve, reject) => {
        // ... Make your API call to your authentication server ...
        // Example assuming successful login
        const user = {
          // ... user data
          roles: ['admin', 'user'] // Example roles
        };
        // Commit the user data to the store
        commit('SET_USER', user);
        resolve(user); // Resolve the promise
      });
    },
    // ... other actions
  },
  /*getters: {
    // Derived state properties
    doubledCount(state) {
      return state.count * 2
    },
    // ... other getters
  }, */
  modules: {
    // Optional: Add more modules for organizing your store
  }
})
