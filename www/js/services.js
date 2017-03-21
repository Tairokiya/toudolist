angular.module('starter.services', ['ngStorage'])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [
    {
    id: 0,
    name: 'Tairokiya',
    lastText: '',
    face: 'img/ben.png'
  }];

  return {
    all: function() {return chats;},
    remove: function(chat) {chats.splice(chats.indexOf(chat), 1);},
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    },
    fetch: function(chatId){

    }
  };
})

.factory('Task', function($wilddogObject){

})
;
