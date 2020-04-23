'use strict'

const axios = require('axios');

const instance = axios.create({
  baseURL: 'http://localhost:8000/api'
});

export default {
  appUser: {
    create: function(name, email, zip, age, account_id) {
      return instance.post('appuser/create', {
        name, email, zip, age, account_id
      });
    }
  },
  dailyWalk: {

  },
  intentionalWalk: {

  },
};