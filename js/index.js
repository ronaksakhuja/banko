var database = firebase.database();
localStorage.clear();

$("#creategame").on("click", function() {
    gameID = "";
    $.getJSON("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1", function(data) {
        gameID = data["deck_id"];
        //init deck
        name = $("#name")[0].value;
        createNewGame(gameID, name);
        localStorage.setItem("gameID", gameID);

        window.location = "game.html"

    });
});
$("#joinGame").on("click", function() {
    gameID = $("#idname")[0].value
    name = $("#name")[0].value;

    game = joinGame(gameID, name);
    if (game != 0) {
        localStorage.setItem("gameID", gameID);
        localStorage.setItem("pid", game);
        firebase.database().ref('games/' + gameID + "/players/" + game).set({
            name: name
        });
        window.location = "game.html"
    } else {

        alert("Wrong Game ID " + game);
    }
});

function createNewGame(gameID, name) {
    firebase.database().ref('games/' + gameID).set({
        has_started: 0,
        turn: 0,
        cardsdrawn: 0,
        firstturn: 0,
        pot: -1,
        checkercard: "null"
    });
    firebase.database().ref('games/' + gameID + "/players").set({
        count: 1
    });
    firebase.database().ref('games/' + gameID + "/players/0").set({
        name: name,
        card0: "null",
        card1: "null",
        net: 0
    });
    localStorage.setItem("pid", 0);

}

function joinGame(gameID, name) {
    return firebase.database().ref('/games/' + gameID).once('value').then(function(snapshot) {
        var pid = (snapshot.val() && snapshot.val()["players"].count) || "null";
        console.log(pid);
        localStorage.setItem("gameID", gameID);
        localStorage.setItem("pid", pid);
        firebase.database().ref('games/' + gameID + "/players/" + pid).set({
            name: name,
            card0: "null",
            card1: "null",
            net: 0

        });
        var updates = {};
        updates["games/" + gameID + "/players/count"] = pid + 1;
        firebase.database().ref().update(updates);
        window.location = "game.html"
    });
}